// express/services/whatsappService.js
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, makeInMemoryStore, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const { Settings, Subscription, User, SubscriptionPlan } = require('../models');

let sock = null;
let isInitialized = false;
let clientStatus = 'disconnected';
let adminGroupName = null;
let adminGroupId = null;
let qrGenerationAttempts = 0;
let connectionAttempts = 0;

// Event listeners dan callbacks
const callbacks = {
  onQrCode: () => {},
  onReady: () => {},
  onAuthenticated: () => {},
  onDisconnected: () => {}
};

// Store untuk menyimpan informasi percakapan
const store = makeInMemoryStore({
  logger: pino().child({ level: 'silent', stream: 'store' })
});

// Inisialisasi client WhatsApp
const initWhatsApp = async () => {
  try {
    console.log('Initializing WhatsApp client using Baileys...');
    
    // Reset counters
    qrGenerationAttempts = 0;
    connectionAttempts = 0;
    
    // Buat direktori untuk menyimpan sesi jika belum ada
    const sessionDir = path.join(__dirname, '../baileys_auth_info');
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }
    
    // Persiapkan auth state
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    
    // Ambil versi terbaru Baileys
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);
    
    // Buat socket WhatsApp
    sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: true,
      auth: state,
      browser: ['Kinterstore Bot', 'Chrome', '103.0.5060.114'],
      defaultQueryTimeoutMs: 60000
    });
    
    store.bind(sock.ev);
    
    // Handle connection update
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      // Handle QR code
      if (qr) {
        console.log('QR Code received:', qr);
        qrGenerationAttempts++;
        clientStatus = 'qr';
        callbacks.onQrCode(qr);
        
        // Hentikan jika terlalu banyak percobaan QR
        if (qrGenerationAttempts > 5) {
          console.log('Too many QR generation attempts. Stopping.');
          await sock.logout();
          clientStatus = 'error';
          isInitialized = false;
          sock = null;
          callbacks.onDisconnected('Too many QR attempts');
        }
      }
      
      // Handle connection state
      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error instanceof Boom) && 
                               lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;
        
        console.log('Connection closed due to', lastDisconnect?.error?.message || 'unknown reason');
        
        // Reconnect if not logged out
        if (shouldReconnect) {
          connectionAttempts++;
          
          if (connectionAttempts <= 5) {
            console.log('Reconnecting...');
            setTimeout(initWhatsApp, 5000);
          } else {
            console.log('Too many reconnection attempts. Giving up.');
            clientStatus = 'error';
            isInitialized = false;
            callbacks.onDisconnected('Too many reconnection attempts');
          }
        } else {
          console.log('Connection closed. User logged out.');
          clientStatus = 'disconnected';
          isInitialized = false;
          sock = null;
          callbacks.onDisconnected('Logged out');
        }
      } else if (connection === 'open') {
        console.log('WhatsApp connection opened!');
        clientStatus = 'ready';
        isInitialized = true;
        connectionAttempts = 0;
        
        // Ambil ID grup admin dari pengaturan
        try {
          const groupSettings = await Settings.findOne({ 
            where: { key: 'whatsapp_admin_group' } 
          });
          
          if (groupSettings) {
            adminGroupId = groupSettings.value;
            
            // Ambil nama grup
            const groupNameSetting = await Settings.findOne({ 
              where: { key: 'whatsapp_admin_group_name' } 
            });
            
            if (groupNameSetting) {
              adminGroupName = groupNameSetting.value;
              console.log(`Admin group set to: ${adminGroupName} (${adminGroupId})`);
            } else {
              console.log(`Admin group ID set to: ${adminGroupId}, but name not found`);
              
              // Coba dapatkan nama grup dari WhatsApp
              try {
                const groupMetadata = await sock.groupMetadata(adminGroupId);
                adminGroupName = groupMetadata.subject;
                
                // Simpan nama grup ke database
                await Settings.upsert({
                  key: 'whatsapp_admin_group_name',
                  value: adminGroupName
                });
                
                console.log(`Retrieved and saved group name: ${adminGroupName}`);
              } catch (err) {
                console.error('Error getting group metadata:', err);
              }
            }
          } else {
            console.log('No admin group ID found in settings');
          }
        } catch (err) {
          console.error('Error fetching admin group settings:', err);
        }
        
        callbacks.onReady();
      }
    });
    
    // Handle credentials update
    sock.ev.on('creds.update', saveCreds);
    
    // Handle messages
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type === 'notify') {
        for (const message of messages) {
          if (!message.key.fromMe && message.message) {
            await handleIncomingMessage(message);
          }
        }
      }
    });
    
    // Handle authenticated
    sock.ev.on('auth.update', (auth) => {
      if (auth.authenticated) {
        console.log('WhatsApp client is authenticated');
        clientStatus = 'authenticated';
        callbacks.onAuthenticated();
      }
    });
    
    return true;
    
  } catch (err) {
    console.error('Error initializing WhatsApp client:', err);
    clientStatus = 'error';
    isInitialized = false;
    return false;
  }
};

// Handle pesan masuk
const handleIncomingMessage = async (message) => {
  try {
    // Dapatkan informasi pesan
    const messageContent = message.message.conversation || 
                          message.message.extendedTextMessage?.text || 
                          message.message.imageMessage?.caption || 
                          '';
    
    const sender = message.key.remoteJid;
    const isGroup = sender.endsWith('@g.us');
    
    console.log(`Message received from ${sender}: ${messageContent}`);
    
    // Hanya proses pesan dari grup admin
    if (isGroup && sender === adminGroupId) {
      await handleAdminGroupMessage(message, messageContent);
    } else {
      console.log('Message is not from admin group, ignoring');
    }
  } catch (err) {
    console.error('Error handling incoming message:', err);
  }
};

// Handle pesan dari grup admin
const handleAdminGroupMessage = async (message, text) => {
  try {
    text = text.trim();
    
    // Cek jika ini adalah respons verifikasi (1 untuk verifikasi, 2 untuk tolak)
    if (text === '1' || text === '2') {
      // Dapatkan pesan yang menjadi balasan
      let quotedMsg = null;
      
      if (message.message.extendedTextMessage?.contextInfo?.quotedMessage) {
        const quotedMessageContent = message.message.extendedTextMessage?.contextInfo?.quotedMessage;
        
        // Extract the quoted message text
        quotedMsg = quotedMessageContent.conversation || 
                   quotedMessageContent.extendedTextMessage?.text || 
                   quotedMessageContent.imageMessage?.caption || '';
      }
      
      if (!quotedMsg) {
        await sock.sendMessage(adminGroupId, { 
          text: 'Silakan balas pesan verifikasi yang ingin diproses.' 
        });
        return;
      }
      
      // Parse ID transaksi dari pesan yang dikutip
      const transactionId = extractTransactionId(quotedMsg);
      
      if (!transactionId) {
        await sock.sendMessage(adminGroupId, { 
          text: 'Format pesan tidak valid atau ID transaksi tidak ditemukan.' 
        });
        return;
      }
      
      // Proses verifikasi atau penolakan
      if (text === '1') {
        const result = await approveSubscription(transactionId);
        
        if (result.success) {
          await sock.sendMessage(adminGroupId, { 
            text: `✅ Pembayaran ID ${transactionId} telah DIVERIFIKASI. Langganan telah diaktifkan untuk ${result.username}.` 
          });
        } else {
          await sock.sendMessage(adminGroupId, { 
            text: `❌ Gagal memverifikasi pembayaran: ${result.message}` 
          });
        }
      } else {
        const result = await rejectSubscription(transactionId);
        
        if (result.success) {
          await sock.sendMessage(adminGroupId, { 
            text: `❌ Pembayaran ID ${transactionId} telah DITOLAK. Pengguna ${result.username} telah diberitahu.` 
          });
        } else {
          await sock.sendMessage(adminGroupId, { 
            text: `❌ Gagal menolak pembayaran: ${result.message}` 
          });
        }
      }
    }
  } catch (err) {
    console.error('Error handling admin message:', err);
  }
};

// Ekstrak ID transaksi dari pesan
const extractTransactionId = (message) => {
  try {
    const match = message.match(/ID Transaksi: ([A-Za-z0-9-]+)/);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  } catch (err) {
    console.error('Error extracting transaction ID:', err);
    return null;
  }
};

// Verifikasi pembayaran
const approveSubscription = async (transactionId) => {
  try {
    // Cari transaksi berdasarkan ID
    const subscription = await Subscription.findOne({ 
      where: { 
        tripay_merchant_ref: transactionId,
        status: 'pending',
        payment_status: 'pending'
      },
      include: [{ 
        model: User,
        attributes: ['id', 'username', 'email', 'phone'] 
      }]
    });
    
    if (!subscription) {
      return { success: false, message: 'Transaksi tidak ditemukan atau sudah diproses' };
    }
    
    // Update status langganan menjadi aktif
    await subscription.update({
      status: 'active',
      payment_status: 'paid'
    });
    
    // Kirim notifikasi ke pengguna jika nomor tersedia
    if (subscription.User.phone) {
      try {
        // Ambil template pesan
        const successTemplate = await Settings.findOne({ 
          where: { key: 'success_message_template' } 
        });
        
        if (successTemplate && successTemplate.value) {
          await sendSuccessMessage(subscription, successTemplate.value);
        }
      } catch (notifyError) {
        console.error('Error sending notification to user:', notifyError);
      }
    }
    
    return { 
      success: true,
      username: subscription.User.username,
      userId: subscription.User.id,
      email: subscription.User.email
    };
    
  } catch (err) {
    console.error('Error approving subscription:', err);
    return { success: false, message: err.message };
  }
};

// Kirim pesan sukses ke pengguna
const sendSuccessMessage = async (subscription, templateText) => {
  try {
    const user = subscription.User;
    const phone = formatPhoneNumber(user.phone);
    
    // Periksa langganan untuk mendapatkan informasi paket
    const plan = await SubscriptionPlan.findByPk(subscription.plan_id);
    
    // Ganti placeholder dengan data sebenarnya
    let message = templateText;
    message = message.replace(/{username}/g, user.username);
    message = message.replace(/{email}/g, user.email);
    message = message.replace(/{plan_name}/g, plan?.name || 'Langganan');
    message = message.replace(/{duration}/g, plan?.duration_days || '');
    message = message.replace(/{end_date}/g, new Date(subscription.end_date).toLocaleDateString('id-ID'));
    
    // Kirim pesan ke pengguna
    await sock.sendMessage(phone, { text: message });
    
    return true;
  } catch (err) {
    console.error('Error sending success message:', err);
    return false;
  }
};

// Tolak pembayaran
const rejectSubscription = async (transactionId) => {
  try {
    // Cari transaksi berdasarkan ID
    const subscription = await Subscription.findOne({ 
      where: { 
        tripay_merchant_ref: transactionId,
        status: 'pending',
        payment_status: 'pending'
      },
      include: [{ 
        model: User,
        attributes: ['id', 'username', 'email', 'phone'] 
      }]
    });
    
    if (!subscription) {
      return { success: false, message: 'Transaksi tidak ditemukan atau sudah diproses' };
    }
    
    // Update status langganan menjadi ditolak
    await subscription.update({
      status: 'canceled',
      payment_status: 'failed'
    });
    
    // Kirim notifikasi ke pengguna jika nomor tersedia
    if (subscription.User.phone) {
      try {
        // Ambil template pesan
        const rejectedTemplate = await Settings.findOne({ 
          where: { key: 'rejected_message_template' } 
        });
        
        if (rejectedTemplate && rejectedTemplate.value) {
          await sendRejectionMessage(subscription, rejectedTemplate.value);
        }
      } catch (notifyError) {
        console.error('Error sending notification to user:', notifyError);
      }
    }
    
    return { 
      success: true,
      username: subscription.User.username,
      userId: subscription.User.id,
      email: subscription.User.email
    };
    
  } catch (err) {
    console.error('Error rejecting subscription:', err);
    return { success: false, message: err.message };
  }
};

// Kirim pesan penolakan ke pengguna
const sendRejectionMessage = async (subscription, templateText) => {
  try {
    const user = subscription.User;
    const phone = formatPhoneNumber(user.phone);
    
    // Periksa langganan untuk mendapatkan informasi paket
    const plan = await SubscriptionPlan.findByPk(subscription.plan_id);
    
    // Ganti placeholder dengan data sebenarnya
    let message = templateText;
    message = message.replace(/{username}/g, user.username);
    message = message.replace(/{email}/g, user.email);
    message = message.replace(/{plan_name}/g, plan?.name || 'Langganan');
    message = message.replace(/{duration}/g, plan?.duration_days || '');
    
    // Kirim pesan ke pengguna
    await sock.sendMessage(phone, { text: message });
    
    return true;
  } catch (err) {
    console.error('Error sending rejection message:', err);
    return false;
  }
};

// Format nomor telepon
const formatPhoneNumber = (phone) => {
  if (!phone) return null;
  
  // Hapus semua karakter non-angka
  let phoneNumber = phone.replace(/[^0-9]/g, '');
  
  // Pastikan awalan benar
  if (!phoneNumber.startsWith('62')) {
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '62' + phoneNumber.substring(1);
    } else {
      phoneNumber = '62' + phoneNumber;
    }
  }
  
  return phoneNumber + '@s.whatsapp.net';
};

// Kirim notifikasi verifikasi ke grup admin
const sendVerificationRequest = async (subscription, user, plan) => {
  try {
    if (!sock || clientStatus !== 'ready' || !adminGroupId) {
      console.error('WhatsApp client is not ready or admin group not configured');
      return false;
    }
    
    // Ambil template pesan
    const template = await Settings.findOne({ where: { key: 'verification_message_template' } });
    const templateText = template?.value || `*VERIFIKASI PEMBAYARAN BARU*
    
Nama: {username}
Email: {email}
ID Transaksi: {transaction_id}
Paket: {plan_name}
Durasi: {duration} hari
Nominal: Rp {price}
Waktu: {datetime}

Balas pesan ini dengan angka:
*1* untuk *VERIFIKASI*
*2* untuk *TOLAK*`;
    
    // Ganti placeholder dengan data sebenarnya
    let message = templateText;
    message = message.replace(/{username}/g, user.username);
    message = message.replace(/{email}/g, user.email);
    message = message.replace(/{transaction_id}/g, subscription.tripay_merchant_ref);
    message = message.replace(/{plan_name}/g, plan.name);
    message = message.replace(/{duration}/g, plan.duration_days);
    message = message.replace(/{price}/g, parseFloat(plan.price).toLocaleString('id-ID'));
    message = message.replace(/{datetime}/g, new Date().toLocaleString('id-ID'));
    
    // Kirim pesan ke grup admin
    await sock.sendMessage(adminGroupId, { text: message });
    return true;
  } catch (err) {
    console.error('Error sending verification request:', err);
    return false;
  }
};

// Kirim pesan ke pengguna
const sendMessageToUser = async (phone, message) => {
  try {
    if (!sock || clientStatus !== 'ready') {
      console.error('WhatsApp client is not ready');
      return false;
    }
    
    const formattedPhone = formatPhoneNumber(phone);
    
    // Kirim pesan
    await sock.sendMessage(formattedPhone, { text: message });
    return true;
  } catch (err) {
    console.error('Error sending message to user:', err);
    return false;
  }
};

// Logout dan hapus sesi
const logout = async () => {
  try {
    if (sock && clientStatus === 'ready') {
      await sock.logout();
    }
    clientStatus = 'disconnected';
    isInitialized = false;
    sock = null;
    return true;
  } catch (err) {
    console.error('Error logging out WhatsApp client:', err);
    return false;
  }
};

// Mendapatkan status WhatsApp client
const getStatus = () => {
  return {
    status: clientStatus,
    qrCode: null, // Tidak menyimpan QR code dalam variabel karena Baileys menampilkan di terminal
    isInitialized,
    adminGroupName
  };
};

// Set callback handler
const setCallbacks = (handlers) => {
  if (handlers.onQrCode) callbacks.onQrCode = handlers.onQrCode;
  if (handlers.onReady) callbacks.onReady = handlers.onReady;
  if (handlers.onAuthenticated) callbacks.onAuthenticated = handlers.onAuthenticated;
  if (handlers.onDisconnected) callbacks.onDisconnected = handlers.onDisconnected;
};

// Set grup admin
const setAdminGroup = async (groupId, groupName) => {
  try {
    adminGroupId = groupId;
    adminGroupName = groupName;
    
    // Simpan ke pengaturan
    await Settings.upsert({
      key: 'whatsapp_admin_group',
      value: groupId
    });
    
    await Settings.upsert({
      key: 'whatsapp_admin_group_name',
      value: groupName
    });
    
    return true;
  } catch (err) {
    console.error('Error setting admin group:', err);
    return false;
  }
};

// Dapatkan daftar grup
const getGroups = async () => {
  try {
    if (!sock || clientStatus !== 'ready') {
      return { success: false, message: 'WhatsApp client is not ready' };
    }
    
    const groups = [];
    
    // Dapatkan daftar chat yang tersimpan
    const chats = await sock.groupFetchAllParticipating();
    
    // Konversi objek chats ke array
    for (const [id, chat] of Object.entries(chats)) {
      if (id.endsWith('@g.us')) {
        groups.push({
          id: id,
          name: chat.subject,
          participantsCount: chat.participants ? chat.participants.length : 0
        });
      }
    }
    
    return {
      success: true,
      groups: groups
    };
  } catch (err) {
    console.error('Error fetching groups:', err);
    return {
      success: false,
      message: err.message,
      groups: []
    };
  }
};

module.exports = {
  initWhatsApp,
  getStatus,
  logout,
  setCallbacks,
  setAdminGroup,
  sendVerificationRequest,
  sendMessageToUser,
  getGroups
};