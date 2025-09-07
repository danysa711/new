// controllers/BaileysController.js
const { User, QrisPayment, Subscription, SubscriptionPlan, db } = require("../models");
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode');
const { Boom } = require('@hapi/boom');
const makeWASocket = require('@whiskeysockets/baileys').default;
const { DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');

// Global WhatsApp connection
global.waConnection = null;

// Get WhatsApp settings
const getSettings = async (req, res) => {
  try {
    // Verify admin
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }
    
    // Get Baileys settings
    const settings = await db.BaileysSettings.findOne({
      order: [['id', 'DESC']]
    });
    
    if (settings) {
      return res.status(200).json({
        phoneNumber: settings.phone_number,
        groupName: settings.group_name,
        notificationEnabled: settings.notification_enabled,
        templateMessage: settings.template_message,
        status: global.waConnection && global.waConnection.isConnected ? 'connected' : 'disconnected'
      });
    } else {
      return res.status(200).json({
        phoneNumber: '',
        groupName: '',
        notificationEnabled: true,
        templateMessage: 'Permintaan pembayaran baru dari {username} ({email}) dengan nominal Rp {amount} untuk paket {plan_name}. Nomor pesanan: {order_number}. Balas *1* untuk verifikasi atau *2* untuk tolak.',
        status: 'disconnected'
      });
    }
  } catch (error) {
    console.error("Error getting WhatsApp settings:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

// Save WhatsApp settings
const saveSettings = async (req, res) => {
  try {
    // Verify admin
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }
    
    const { phoneNumber, groupName, notificationEnabled, templateMessage } = req.body;
    
    // Validate input
    if (!phoneNumber) {
      return res.status(400).json({ error: "Nomor WhatsApp harus diisi" });
    }
    
    if (!groupName) {
      return res.status(400).json({ error: "Nama grup harus diisi" });
    }
    
    if (!templateMessage) {
      return res.status(400).json({ error: "Template pesan harus diisi" });
    }
    
    // Get existing settings
    let settings = await db.BaileysSettings.findOne({
      order: [['id', 'DESC']]
    });
    
    if (settings) {
      // Update existing settings
      await settings.update({
        phone_number: phoneNumber,
        group_name: groupName,
        notification_enabled: notificationEnabled !== false,
        template_message: templateMessage
      });
    } else {
      // Create new settings
      settings = await db.BaileysSettings.create({
        phone_number: phoneNumber,
        group_name: groupName,
        notification_enabled: notificationEnabled !== false,
        template_message: templateMessage
      });
    }
    
    return res.status(200).json({
      success: true,
      message: "Pengaturan WhatsApp berhasil disimpan"
    });
  } catch (error) {
    console.error("Error saving WhatsApp settings:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

// Connect WhatsApp
const connect = async (req, res) => {
  try {
    // Verify admin
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }
    
    // Get Baileys settings
    const settings = await db.BaileysSettings.findOne({
      order: [['id', 'DESC']]
    });
    
    if (!settings || !settings.phone_number) {
      return res.status(400).json({ error: "Pengaturan WhatsApp belum dikonfigurasi" });
    }
    
    // Create auth directory if not exists
    const authDir = path.join(__dirname, '../baileys_auth');
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    const uploadsDir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Use auth state
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    
    // Create WhatsApp socket
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: true
    });
    
    // Listen for QR code
    let qr = null;
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr: newQr } = update;
      
      if (newQr) {
        // Generate QR code as data URL
        qr = await qrcode.toDataURL(newQr);
        
        // Extract base64 data
        qr = qr.split(',')[1];
        
        // Send QR code to client if we're still waiting for response
        if (!res.headersSent) {
          return res.status(200).json({
            qrCode: qr
          });
        }
      }
      
      if (connection === 'open') {
        console.log('WhatsApp connected!');
        
        // Save connection to global
        global.waConnection = {
          sock,
          isConnected: true,
          
          // Helper method to send group message
          sendGroupMessage: async (groupName, message) => {
            try {
              // Get groups
              const groups = await sock.groupFetchAllParticipating();
              
              // Find group by name
              const group = Object.values(groups).find(g => 
                g.subject.toLowerCase() === groupName.toLowerCase()
              );
              
              if (!group) {
                throw new Error(`Group "${groupName}" not found`);
              }
              
              // Send message to group
              await sock.sendMessage(group.id, { text: message });
              return true;
            } catch (error) {
              console.error("Error sending group message:", error);
              throw error;
            }
          }
        };
        
        // Log connection
        await db.BaileysLog.create({
          type: 'connection',
          status: 'success',
          message: `WhatsApp connected with number ${sock.user.id}`
        });
      }
      
      if (connection === 'close') {
        // Log disconnection
        await db.BaileysLog.create({
          type: 'connection',
          status: 'failed',
          message: `WhatsApp connection closed: ${lastDisconnect?.error?.message || 'Unknown reason'}`
        });
        
        // Reset global connection
        global.waConnection = null;
        
        // Fix: Removed TypeScript type casting
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        
        // Reconnect if not logged out
        if (statusCode !== DisconnectReason.loggedOut) {
          console.log('Reconnecting WhatsApp...');
        } else {
          console.log('WhatsApp logged out');
        }
      }
    });
    
    // Save credentials
    sock.ev.on('creds.update', saveCreds);
    
    // Listen for messages
    sock.ev.on('messages.upsert', async ({ messages }) => {
      for (const message of messages) {
        if (message.key.fromMe) continue;
        
        // Process group messages
        if (message.key.remoteJid?.endsWith('@g.us') && message.message?.conversation) {
          const messageText = message.message.conversation.trim();
          
          // Check if this is a verification response (1 or 2)
          if (messageText === '1' || messageText === '2') {
            await processVerificationResponse(message.key.remoteJid, message.key.participant, messageText);
          }
        }
      }
    });
    
    // If no QR code within 10 seconds, return error
    setTimeout(() => {
      if (!qr && !res.headersSent) {
        return res.status(408).json({ error: "Timeout waiting for QR code" });
      }
    }, 10000);
    
  } catch (error) {
    console.error("Error connecting WhatsApp:", error);
    
    // Log error
    await db.BaileysLog.create({
      type: 'connection',
      status: 'failed',
      message: `Error connecting WhatsApp: ${error.message}`
    });
    
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

// Disconnect WhatsApp
const disconnect = async (req, res) => {
  try {
    // Verify admin
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }
    
    if (!global.waConnection || !global.waConnection.isConnected) {
      return res.status(400).json({ error: "WhatsApp tidak terhubung" });
    }
    
    // Disconnect WhatsApp
    await global.waConnection.sock.logout();
    global.waConnection = null;
    
    // Log disconnection
    await db.BaileysLog.create({
      type: 'connection',
      status: 'success',
      message: 'WhatsApp disconnected by admin'
    });
    
    return res.status(200).json({
      success: true,
      message: "WhatsApp berhasil diputuskan"
    });
  } catch (error) {
    console.error("Error disconnecting WhatsApp:", error);
    
    // Log error
    await db.BaileysLog.create({
      type: 'connection',
      status: 'failed',
      message: `Error disconnecting WhatsApp: ${error.message}`
    });
    
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

// Check WhatsApp connection status
const getStatus = async (req, res) => {
  try {
    // Verify admin
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }
    
    return res.status(200).json({
      status: global.waConnection && global.waConnection.isConnected ? 'connected' : 'disconnected'
    });
  } catch (error) {
    console.error("Error checking WhatsApp status:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

// Get WhatsApp logs
const getLogs = async (req, res) => {
  try {
    // Verify admin
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }
    
    // Get logs
    const logs = await db.BaileysLog.findAll({
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    
    return res.status(200).json(logs);
  } catch (error) {
    console.error("Error getting WhatsApp logs:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

// Process verification response from WhatsApp
const processVerificationResponse = async (groupJid, senderJid, response) => {
  try {
    // Get latest pending payment
    const pendingPayment = await QrisPayment.findOne({
      where: {
        status: 'waiting_verification'
      },
      order: [['created_at', 'DESC']]
    });
    
    if (!pendingPayment) {
      console.log("No pending payment found for verification");
      return;
    }
    
    // Process response
    if (response === '1') {
      // Verify payment
      await pendingPayment.update({
        status: 'verified',
        verified_at: new Date()
      });
      
      // Get user and plan
      const user = await User.findByPk(pendingPayment.user_id);
      const plan = await SubscriptionPlan.findByPk(pendingPayment.plan_id);
      
      if (!user || !plan) {
        console.error("User or plan not found for verification");
        return;
      }
      
      // Check if user has active subscription
      const activeSubscription = await Subscription.findOne({
        where: {
          user_id: pendingPayment.user_id,
          status: "active",
          end_date: {
            [db.Sequelize.Op.gt]: new Date()
          }
        }
      });
      
      if (activeSubscription) {
        // Extend existing subscription
        const newEndDate = new Date(activeSubscription.end_date);
        newEndDate.setDate(newEndDate.getDate() + plan.duration_days);
        
        await activeSubscription.update({
          end_date: newEndDate,
          payment_status: "paid",
          payment_method: "QRIS"
        });
      } else {
        // Create new subscription
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + plan.duration_days);
        
        await Subscription.create({
          user_id: pendingPayment.user_id,
          start_date: startDate,
          end_date: endDate,
          status: "active",
          payment_status: "paid",
          payment_method: "QRIS"
        });
      }
      
      // Log verification
      await db.BaileysLog.create({
        type: 'verification',
        status: 'success',
        message: `Pembayaran #${pendingPayment.order_number} diverifikasi melalui WhatsApp`,
        data: {
          payment_id: pendingPayment.id,
          order_number: pendingPayment.order_number,
          user_id: pendingPayment.user_id,
          username: user.username,
          sender: senderJid
        }
      });
      
      // Send confirmation message
      if (global.waConnection && global.waConnection.isConnected) {
        const settings = await db.BaileysSettings.findOne({
          order: [['id', 'DESC']]
        });
        
        if (settings) {
          await global.waConnection.sendGroupMessage(
            settings.group_name,
            `✅ Pembayaran #${pendingPayment.order_number} dari ${user.username} (${user.email}) sebesar Rp ${pendingPayment.amount.toLocaleString('id-ID')} telah berhasil diverifikasi.`
          );
        }
      }
      
    } else if (response === '2') {
      // Reject payment
      await pendingPayment.update({
        status: 'rejected',
        rejected_at: new Date()
      });
      
      // Get user
      const user = await User.findByPk(pendingPayment.user_id);
      
      if (!user) {
        console.error("User not found for rejection");
        return;
      }
      
      // Log rejection
      await db.BaileysLog.create({
        type: 'verification',
        status: 'failed',
        message: `Pembayaran #${pendingPayment.order_number} ditolak melalui WhatsApp`,
        data: {
          payment_id: pendingPayment.id,
          order_number: pendingPayment.order_number,
          user_id: pendingPayment.user_id,
          username: user.username,
          sender: senderJid
        }
      });
      
      // Send rejection message
      if (global.waConnection && global.waConnection.isConnected) {
        const settings = await db.BaileysSettings.findOne({
          order: [['id', 'DESC']]
        });
        
        if (settings) {
          await global.waConnection.sendGroupMessage(
            settings.group_name,
            `❌ Pembayaran #${pendingPayment.order_number} dari ${user.username} (${user.email}) sebesar Rp ${pendingPayment.amount.toLocaleString('id-ID')} telah ditolak.`
          );
        }
      }
    }
  } catch (err) {
    console.error("Error processing verification response:", err);
    
    // Log error
    await db.BaileysLog.create({
      type: 'verification',
      status: 'failed',
      message: `Error saat memproses verifikasi: ${err.message}`,
      data: {
        error: err.message,
        groupJid,
        senderJid,
        response
      }
    });
  }
};

module.exports = {
  getSettings,
  saveSettings,
  connect,
  disconnect,
  getStatus,
  getLogs
};