// express/utils/whatsapp-client.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer'); // Tambahkan import puppeteer

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
    console.log('WhatsApp client sudah diinisialisasi');
    return client;
  }
  
  console.log('Menginisialisasi WhatsApp client');
  
  // Konfigurasi puppeteer untuk whatsapp-web.js
  const puppeteerOptions = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ],
    executablePath: puppeteer.executablePath()
  };
  
  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: puppeteerOptions
  });
  
  client.on('qr', (qrCode) => {
    console.log('QR code diterima');
    qr = qrCode;
  });
  
  client.on('ready', () => {
    console.log('WhatsApp client siap digunakan');
    isClientReady = true;
    qr = null;
  });
  
  client.on('authenticated', () => {
    console.log('WhatsApp client terautentikasi');
  });
  
  client.on('auth_failure', (error) => {
    console.error('Autentikasi WhatsApp gagal:', error);
    isClientReady = false;
  });
  
  client.on('disconnected', () => {
    console.log('WhatsApp client terputus');
    isClientReady = false;
    client = null;
    // Inisialisasi ulang saat terputus dengan delay
    setTimeout(() => initClient(), 5000);
  });
  
  client.initialize().catch(error => {
    console.error('Error inisialisasi WhatsApp client:', error);
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
    console.error('Error membuat QR code:', error);
    return null;
  }
};

// Fungsi untuk mengirim pesan
const sendMessage = async (number, message) => {
  if (!client || !isClientReady) {
    console.log('WhatsApp client belum siap');
    return false;
  }
  
  try {
    // Format nomor telepon
    const formattedNumber = number.includes('@c.us') ? number : `${number}@c.us`;
    
    // Kirim pesan
    await client.sendMessage(formattedNumber, message);
    console.log(`Pesan terkirim ke ${formattedNumber}`);
    return true;
  } catch (error) {
    console.error('Error mengirim pesan WhatsApp:', error);
    return false;
  }
};

// Fungsi untuk mengirim pesan ke grup
const sendGroupMessage = async (groupId, message) => {
  if (!client || !isClientReady) {
    console.log('WhatsApp client belum siap');
    return false;
  }
  
  try {
    // Format ID grup
    const formattedGroupId = groupId.includes('@g.us') ? groupId : `${groupId}@g.us`;
    
    // Kirim pesan
    await client.sendMessage(formattedGroupId, message);
    console.log(`Pesan terkirim ke grup ${formattedGroupId}`);
    return true;
  } catch (error) {
    console.error('Error mengirim pesan grup WhatsApp:', error);
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
    console.log('WhatsApp client berhasil logout');
    return true;
  } catch (error) {
    console.error('Error saat logout WhatsApp client:', error);
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