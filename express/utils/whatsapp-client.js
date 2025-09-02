// express/utils/whatsapp-client.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Pastikan direktori auth ada
const ensureAuthDir = () => {
  const authDir = path.join(__dirname, '../.wwebjs_auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
};

// Inisialisasi client
let client = null;
let qr = null;
let isClientReady = false;

// Fungsi untuk inisialisasi client
const initClient = () => {
  ensureAuthDir();
  
  if (client !== null) {
    console.log('WhatsApp client already initialized');
    return client;
  }
  
  console.log('Initializing WhatsApp client');
  
  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });
  
  client.on('qr', (qrCode) => {
    console.log('QR code received');
    qr = qrCode;
  });
  
  client.on('ready', () => {
    console.log('WhatsApp client is ready');
    isClientReady = true;
    qr = null;
  });
  
  client.on('authenticated', () => {
    console.log('WhatsApp client authenticated');
  });
  
  client.on('auth_failure', (error) => {
    console.error('WhatsApp authentication failed:', error);
    isClientReady = false;
  });
  
  client.on('disconnected', () => {
    console.log('WhatsApp client disconnected');
    isClientReady = false;
    client = null;
    initClient(); // Re-initialize on disconnect
  });
  
  client.initialize().catch(error => {
    console.error('Error initializing WhatsApp client:', error);
    isClientReady = false;
  });
  
  return client;
};

// Fungsi untuk mendapatkan QR code sebagai base64
const getQrCode = async () => {
  if (!client) {
    initClient();
  }
  
  if (!qr) {
    return null;
  }
  
  try {
    return await qrcode.toDataURL(qr);
  } catch (error) {
    console.error('Error generating QR code:', error);
    return null;
  }
};

// Fungsi untuk mengirim pesan
const sendMessage = async (number, message) => {
  if (!client || !isClientReady) {
    console.log('WhatsApp client not ready');
    return false;
  }
  
  try {
    // Format nomor telepon
    const formattedNumber = number.includes('@c.us') ? number : `${number}@c.us`;
    
    // Kirim pesan
    await client.sendMessage(formattedNumber, message);
    console.log(`Message sent to ${formattedNumber}`);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
};

// Fungsi untuk mengirim pesan ke grup
const sendGroupMessage = async (groupId, message) => {
  if (!client || !isClientReady) {
    console.log('WhatsApp client not ready');
    return false;
  }
  
  try {
    // Format ID grup
    const formattedGroupId = groupId.includes('@g.us') ? groupId : `${groupId}@g.us`;
    
    // Kirim pesan
    await client.sendMessage(formattedGroupId, message);
    console.log(`Message sent to group ${formattedGroupId}`);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp group message:', error);
    return false;
  }
};

// Fungsi untuk logout
const logout = async () => {
  if (!client) {
    return true;
  }
  
  try {
    await client.logout();
    client = null;
    isClientReady = false;
    qr = null;
    console.log('WhatsApp client logged out');
    return true;
  } catch (error) {
    console.error('Error logging out WhatsApp client:', error);
    return false;
  }
};

// Fungsi untuk memeriksa status koneksi
const isReady = () => {
  return isClientReady;
};

// Fungsi untuk mendapatkan client
const getClient = () => {
  if (!client) {
    return initClient();
  }
  return client;
};

module.exports = {
  initClient,
  getQrCode,
  sendMessage,
  sendGroupMessage,
  logout,
  isReady,
  getClient
};