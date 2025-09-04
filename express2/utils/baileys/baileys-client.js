// Deklarasi variabel untuk Baileys
let makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore;

// Import baileys secara dinamis
const importBaileys = async () => {
  try {
    const baileys = await import('@whiskeysockets/baileys');
    makeWASocket = baileys.default;
    useMultiFileAuthState = baileys.useMultiFileAuthState;
    DisconnectReason = baileys.DisconnectReason;
    fetchLatestBaileysVersion = baileys.fetchLatestBaileysVersion;
    makeCacheableSignalKeyStore = baileys.makeCacheableSignalKeyStore;
    console.log("Baileys modules imported successfully");
    return true;
  } catch (error) {
    console.error("Error importing Baileys:", error);
    return false;
  }
};

const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-terminal');
const { promisify } = require('util');

// Path untuk menyimpan credentials
const AUTH_PATH = path.join(__dirname, '../../.baileys_auth_info');

// Pastikan direktori auth ada
const ensureAuthDir = () => {
  if (!fs.existsSync(AUTH_PATH)) {
    fs.mkdirSync(AUTH_PATH, { recursive: true });
  }
};

// Status client
let socket = null;
let isClientReady = false;
let qr = null;
let qrGenerated = false;
let initializationPromise = null;

// Fungsi untuk menginisialisasi socket
const initSocket = async () => {
  try {
    // Pastikan baileys sudah diimpor
    if (!makeWASocket) {
      await importBaileys();
      
      // Jika masih gagal mengimpor, gunakan dummy mode
      if (!makeWASocket) {
        console.log("Gagal mengimpor modul Baileys, menggunakan dummy mode");
        return createDummySocket();
      }
    }
    
    ensureAuthDir();
    
    if (socket !== null && isClientReady) {
      console.log('Baileys client sudah terinisialisasi');
      return socket;
    }
    
    // Jika sedang dalam proses inisialisasi, tunggu proses tersebut
    if (initializationPromise) {
      return initializationPromise;
    }
    
    console.log('Menginisialisasi Baileys client');
  
  // Buat promise untuk inisialisasi
  initializationPromise = (async () => {
    try {
      // Menggunakan auth state dari file
      const { state, saveCreds } = await useMultiFileAuthState(AUTH_PATH);
      
      // Ambil versi terbaru
      const { version } = await fetchLatestBaileysVersion();
      
      // Buat socket
      socket = makeWASocket({
        version,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, console.log)
        },
        printQRInTerminal: false,
        markOnlineOnConnect: true,
        defaultQueryTimeoutMs: 60000,
        getMessage: async () => {
          return { conversation: 'Hello' };
        }
      });
      
      // Handle koneksi
      socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr: newQr } = update;
        
        if (newQr) {
          qr = newQr;
          qrGenerated = true;
          console.log('QR code baru diterima');
          
          // Tampilkan QR di terminal (opsional)
          qrcode.generate(newQr, { small: true });
        }
        
        if (connection === 'open') {
          isClientReady = true;
          qr = null;
          qrGenerated = false;
          console.log('Baileys client terhubung');
        }
        
        if (connection === 'close') {
          isClientReady = false;
          
          const shouldReconnect = (lastDisconnect?.error instanceof Boom) ? 
            lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : true;
          
          console.log('Koneksi terputus karena ', lastDisconnect?.error, ', mencoba kembali: ', shouldReconnect);
          
          if (shouldReconnect) {
            initializationPromise = null;
            socket = null;
            setTimeout(() => {
              initSocket();
            }, 5000);
          } else {
            console.log('Koneksi terputus secara permanen, logout berhasil');
            // Hapus credentials jika logout
            if (fs.existsSync(AUTH_PATH)) {
              fs.rmdirSync(AUTH_PATH, { recursive: true });
            }
          }
        }
      });
      
      // Save credentials on update
      socket.ev.on('creds.update', saveCreds);
      
      return socket;
      } catch (error) {
        console.error("Error initializing Baileys client:", error);
        // Fallback ke dummy socket
        return createDummySocket();
      }
    })();
  
  return initializationPromise;
  } catch (outerError) {
    console.error("Unexpected error in initSocket:", outerError);
    return createDummySocket();
  }
};

// Fungsi untuk membuat dummy socket untuk pengembangan
const createDummySocket = () => {
  console.log("Membuat dummy socket untuk development");
  
  // Buat socket dummy yang tidak melakukan apa-apa tapi tidak error
  const dummySocket = {
    ev: {
      on: (event, callback) => {
        if (event === 'connection.update') {
          // Simulasikan QR code
          setTimeout(() => {
            callback({
              qr: "dummy-qr-code-for-development"
            });
          }, 1000);
        }
      }
    },
    sendMessage: async () => {
      console.log("Dummy sendMessage dipanggil");
      return true;
    },
    sendGroupMessage: async () => {
      console.log("Dummy sendGroupMessage dipanggil");
      return true;
    },
    logout: async () => {
      console.log("Dummy logout dipanggil");
      return true;
    }
  };
  
  socket = dummySocket;
  
  // Set qr dummy untuk dev
  setTimeout(() => {
    qr = "dummy-qr-code-for-development";
    qrGenerated = true;
  }, 1000);
  
  return dummySocket;
};

// Fungsi untuk mendapatkan QR code
const getQrCode = async () => {
  // Pastikan baileys sudah diimpor
  if (!makeWASocket) {
    await importBaileys();
  }
  
  if (!socket) {
    await initSocket();
  }
  
  if (!qr || !qrGenerated) {
    return null;
  }
  
  return qr;
};

// Fungsi untuk mengirim pesan
const sendMessage = async (number, message) => {
  // Pastikan baileys sudah diimpor
  if (!makeWASocket) {
    await importBaileys();
  }
  
  if (!socket || !isClientReady) {
    console.log('Baileys client belum siap');
    return false;
  }
  
  try {
    // Format nomor telepon
    const formattedNumber = number.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
    
    // Kirim pesan
    await socket.sendMessage(formattedNumber, { text: message });
    console.log(`Pesan terkirim ke ${formattedNumber}`);
    return true;
  } catch (error) {
    console.error('Error mengirim pesan WhatsApp:', error);
    return false;
  }
};

// Fungsi untuk mengirim pesan ke grup
const sendGroupMessage = async (groupId, message) => {
  // Pastikan baileys sudah diimpor
  if (!makeWASocket) {
    await importBaileys();
  }
  
  if (!socket || !isClientReady) {
    console.log('Baileys client belum siap');
    return false;
  }
  
  try {
    // Format ID grup
    const formattedGroupId = groupId.includes('@g.us') ? groupId : `${groupId}@g.us`;
    
    // Kirim pesan
    await socket.sendMessage(formattedGroupId, { text: message });
    console.log(`Pesan terkirim ke grup ${formattedGroupId}`);
    return true;
  } catch (error) {
    console.error('Error mengirim pesan grup WhatsApp:', error);
    return false;
  }
};

// Fungsi untuk logout
const logout = async () => {
  // Pastikan baileys sudah diimpor
  if (!makeWASocket) {
    await importBaileys();
  }
  
  if (!socket) {
    return true;
  }
  
  try {
    await socket.logout();
    socket = null;
    isClientReady = false;
    qr = null;
    qrGenerated = false;
    
    // Hapus kredensial
    if (fs.existsSync(AUTH_PATH)) {
      fs.rmdirSync(AUTH_PATH, { recursive: true });
    }
    
    console.log('Baileys client berhasil logout');
    return true;
  } catch (error) {
    console.error('Error saat logout Baileys client:', error);
    return false;
  }
};

// Fungsi untuk memeriksa status koneksi
const isReady = () => {
  return isClientReady;
};

// Fungsi untuk mendapatkan client
const getClient = async () => {
  // Pastikan baileys sudah diimpor
  if (!makeWASocket) {
    await importBaileys();
  }
  
  if (!socket) {
    return initSocket();
  }
  return socket;
};

// Inisialisasi modul Baileys saat file ini dimuat
importBaileys();

module.exports = {
  initSocket,
  getQrCode,
  sendMessage,
  sendGroupMessage,
  logout,
  isReady,
  getClient
};