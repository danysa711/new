// Perbaikan untuk express/server.js
// Tambahkan rute baru dan hapus fallback manual payment methods
require('dotenv').config();
const axios = require('axios');
const express = require("express");
const cors = require("cors");
const { db } = require("./models");
const homeRoutes = require("./routes/homeRoutes"); // Interface Domain Backend

const licenseRoutes = require("./routes/licenseRoutes");
const softwareRoutes = require("./routes/softwareRoutes");
const softwareVersionRoutes = require("./routes/softwareVersionRoutes");
const orderRoutes = require("./routes/orderRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const publicApiRoutes = require("./routes/publicApiRoutes");
const settingsRoutes = require('./routes/settingsRoutes'); // Rute pengaturan
const tripayRoutes = require('./routes/tripayRoutes');
const tripayInterceptor = require('./middlewares/tripayInterceptor');
const tripayTestRoutes = require('./routes/tripayTestRoutes');
const subscriptionDemoRoutes = require('./routes/subscriptionDemoRoutes');

const app = express();
const PORT = process.env.PORT || 3500;

// Kemudian tetapkan default values untuk konfigurasi Tripay
const TRIPAY_PROXY_URL = process.env.TRIPAY_PROXY_URL || "https://callback.kinterstore.com/api/tripay-proxy";
const CALLBACK_URL = process.env.CALLBACK_URL || "https://callback.kinterstore.com/api/tripay/callback/autobot";
const TRIPAY_API_KEY = process.env.TRIPAY_API_KEY || "DEV-API-KEY";
const TRIPAY_PRIVATE_KEY = process.env.TRIPAY_PRIVATE_KEY || "DEV-PRIVATE-KEY";
const TRIPAY_MERCHANT_CODE = process.env.TRIPAY_MERCHANT_CODE || "DEV-MERCHANT";

// Buat variabel global untuk digunakan di controllers
global.TRIPAY_CONFIG = {
  API_KEY: TRIPAY_API_KEY,
  PRIVATE_KEY: TRIPAY_PRIVATE_KEY,
  MERCHANT_CODE: TRIPAY_MERCHANT_CODE,
  API_URL: "https://tripay.co.id/api"
};

db.sequelize.authenticate()
  .then(() => {
    console.log("Database connected, loading configurations...");
    return loadTripayConfigFromDB();
  })
  .catch(err => {
    console.error("Failed to connect to database:", err);
  });

const loadTripayConfigFromDB = async () => {
  try {
    const { Setting } = require('./models');
    
    // Cek apakah model tersedia
    if (!Setting) {
      console.error("Model Setting tidak tersedia");
      return;
    }
    
    // Cari setting API Key
    const apiKeySetting = await Setting.findOne({
      where: { key: 'tripay_api_key' }
    });
    
    // Cari setting Private Key
    const privateKeySetting = await Setting.findOne({
      where: { key: 'tripay_private_key' }
    });
    
    // Cari setting Merchant Code
    const merchantCodeSetting = await Setting.findOne({
      where: { key: 'tripay_merchant_code' }
    });
    
    // Update global TRIPAY_CONFIG jika setting ditemukan
    if (apiKeySetting && apiKeySetting.value) {
      global.TRIPAY_CONFIG.API_KEY = apiKeySetting.value;
      console.log("Loaded Tripay API Key from database");
    }
    
    if (privateKeySetting && privateKeySetting.value) {
      global.TRIPAY_CONFIG.PRIVATE_KEY = privateKeySetting.value;
      console.log("Loaded Tripay Private Key from database");
    }
    
    if (merchantCodeSetting && merchantCodeSetting.value) {
      global.TRIPAY_CONFIG.MERCHANT_CODE = merchantCodeSetting.value;
      console.log("Loaded Tripay Merchant Code from database");
    }
  } catch (error) {
    console.error("Error loading Tripay config from database:", error);
  }
};

// Definisikan corsOptions dengan semua domain yang diizinkan
const corsOptions = {
  origin: function(origin, callback) {
    // Daftar domain yang diperbolehkan
    const allowedOrigins = [
      "https://kinterstore.com",       
      "https://www.kinterstore.com", 
      "https://db.kinterstore.com",
      "https://bot.kinterstore.com",
      "https://kinterstore.my.id",       
      "https://www.kinterstore.my.id", 
      "https://db.kinterstore.my.id",
      "http://localhost:3000",           
      "http://localhost:5173",           
      "http://localhost:5174"            
    ];
    
  // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Origin rejected by CORS:', origin);
      // Saat development, izinkan semua origin
      // Untuk production, hapus baris di bawah ini
      callback(null, true);
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Callback-Signature"],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(tripayInterceptor());
// Middleware CORS khusus untuk callback Tripay
app.use('/api/tripay/callback', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-Callback-Signature, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.get("/api/settings/whatsapp-public", async (req, res) => {
  try {
    // Coba ambil data dari database
    const { WhatsAppSetting } = require('./models');
    
    const settings = await WhatsAppSetting.findOne({
      order: [['id', 'DESC']]
    });
    
    if (settings) {
      return res.json({
        whatsappNumber: settings.whatsapp_number,
        trialEnabled: settings.trial_enabled,
        messageTemplate: settings.trial_template
      });
    } else {
      // Nilai default jika tidak ada data
      return res.json({
        whatsappNumber: '6281284712684',
        trialEnabled: true,
        messageTemplate: 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}'
      });
    }
  } catch (err) {
    console.error('Error mengakses WhatsApp settings:', err);
    // Kembalikan nilai default jika terjadi error
    return res.json({
      whatsappNumber: '6281284712684',
      trialEnabled: true,
      messageTemplate: 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}'
    });
  }
});

// Middleware untuk debug
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Request origin:', req.headers.origin);
  
   // Khusus untuk callback Tripay, izinkan akses tanpa CORS
  if (req.url === '/api/tripay/callback') {
    console.log('Tripay callback received, bypassing CORS checks');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-Callback-Signature, X-Requested-With');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  } else {
    // Untuk request lain, gunakan CORS normal
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  }
  
  next();
});

// Gunakan CORS di seluruh aplikasi
app.use(cors(corsOptions));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Request origin:', req.headers.origin);
  next();
})

// Tambahkan middleware untuk parsing body
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware khusus untuk preflight requests
app.options('*', cors(corsOptions));

// endpoint PROXY Tripay
app.get("/api/tripay/test-connection", async (req, res) => {
  try {
    // Ambil konfigurasi Tripay
    const apiKey = global.TRIPAY_CONFIG.API_KEY || process.env.TRIPAY_API_KEY;
    const TRIPAY_PROXY_URL = process.env.TRIPAY_PROXY_URL || "https://callback.kinterstore.com/api/tripay-proxy";
    
    // Test koneksi ke Tripay via proxy
    const response = await axios.get(`${TRIPAY_PROXY_URL}/merchant/payment-channel`, {
      headers: {
        'X-Tripay-API-Key': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    res.json({
      success: true,
      message: "Koneksi ke Tripay berhasil via proxy",
      channels: response.data.data.slice(0, 5) // Hanya tampilkan 5 channel pertama
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Koneksi ke Tripay gagal",
      error: error.message,
      details: error.response?.data
    });
  }
});

// Endpoint untuk menyimpan WhatsApp settings
app.post("/api/settings/whatsapp", async (req, res) => {
  try {
    const { WhatsAppSetting } = require('./models');
    const { whatsappNumber, trialEnabled, messageTemplate } = req.body;
    
    // Validasi input
    if (!whatsappNumber) {
      return res.status(400).json({ error: 'Nomor WhatsApp harus diisi' });
    }
    
    // Buat setting baru
    await WhatsAppSetting.create({
      whatsapp_number: whatsappNumber,
      trial_enabled: trialEnabled !== undefined ? trialEnabled : true,
      trial_template: messageTemplate || 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}',
      support_enabled: true
    });
    
    res.json({ success: true, message: 'Pengaturan WhatsApp berhasil disimpan' });
  } catch (err) {
    console.error('Error menyimpan pengaturan WhatsApp:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Endpoint diagnostik untuk Tripay
app.get("/api/tripay/diagnostic", (req, res) => {
  const tripayConfig = {
    API_KEY_SET: !!process.env.TRIPAY_API_KEY,
    PRIVATE_KEY_SET: !!process.env.TRIPAY_PRIVATE_KEY,
    MERCHANT_CODE_SET: !!process.env.TRIPAY_MERCHANT_CODE,
    NODE_ENV: process.env.NODE_ENV
  };

  res.json({
    success: true,
    message: "Tripay diagnostic",
    config: tripayConfig,
    serverTime: new Date().toISOString()
  });
});

app.get("/api/tripay/test-connection", async (req, res) => {
  try {
    // Ambil konfigurasi Tripay dari global atau environment
    const apiKey = global.TRIPAY_CONFIG.API_KEY || process.env.TRIPAY_API_KEY;
    
    // Test koneksi ke Tripay
    const response = await axios.get("https://tripay.co.id/api/merchant/payment-channel", {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    res.json({
      success: true,
      message: "Koneksi ke Tripay berhasil",
      channels: response.data.data.slice(0, 5) // Hanya tampilkan 5 channel pertama
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Koneksi ke Tripay gagal",
      error: error.message,
      details: error.response?.data
    });
  }
});

// Tambahkan endpoint untuk menangani callback internal dari VPS
app.post("/api/tripay/internal-callback", (req, res) => {
  try {
    // Verifikasi token internal
    const internalToken = req.headers['x-internal-token'];
    
    if (internalToken !== process.env.INTERNAL_TOKEN) {
      console.error("Invalid internal token received from:", req.ip);
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    console.log("Received forwarded callback from VPS:", req.ip);
    console.log("Callback data:", req.body);
    
    // Proses callback
    tripayController.handleCallback(req, res);
  } catch (error) {
    console.error("Error processing internal callback:", error);
    res.status(500).json({
      success: false,
      message: "Error processing callback",
      error: error.message
    });
  }
});

// Tambahkan import tripayController
const tripayController = require('./controllers/tripayController');

// Perbaikan endpoint internal callback
app.post("/api/tripay/internal-callback", (req, res) => {
  try {
    // Verifikasi token internal
    const internalToken = req.headers['x-internal-token'];
    
    if (internalToken !== process.env.INTERNAL_TOKEN) {
      console.error("Invalid internal token received from:", req.ip);
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    console.log("Received forwarded callback from VPS:", req.ip);
    console.log("Callback data:", req.body);
    
    // Proses callback
    tripayController.handleCallback(req, res);
  } catch (error) {
    console.error("Error processing internal callback:", error);
    res.status(500).json({
      success: false,
      message: "Error processing callback",
      error: error.message
    });
  }
});

const DEBUG_MODE = process.env.DEBUG_MODE === 'true';

// Middleware untuk logging
app.use((req, res, next) => {
  if (DEBUG_MODE) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.method === 'POST' && req.url.includes('/api/subscriptions/purchase')) {
      console.log('Request body:', JSON.stringify(req.body, null, 2));
    }
  }
  next();
});

app.get('/api/tripay/test-interceptor', (req, res) => {
  // Sampel data dengan nilai decimal
  const testData = {
    amount: 100000.50,
    order_items: [
      { name: "Langganan 1 Bulan", price: 100000.50, quantity: 1 }
    ]
  };
  
  console.log('Before intercept:', JSON.stringify(testData));
  
  // Simulasi request ke Tripay
  axios.post('https://tripay.co.id/api/transaction/create', testData, {})
    .catch(() => {}) // Ignore error since this is just a test
    .finally(() => {
      res.json({
        success: true,
        message: "Interceptor test completed",
        original: { amount: 100000.50, price: 100000.50 },
        intercepted: { 
          amount: testData.amount, 
          price: testData.order_items[0].price 
        }
      });
    });
});

// Routes
app.use("/", homeRoutes); // Routes Interface Domain Backend
app.use("/api", licenseRoutes);
app.use("/api", softwareRoutes);
app.use("/api", softwareVersionRoutes);
app.use("/api", orderRoutes);
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", subscriptionRoutes);
app.use("/api/public", publicApiRoutes);
app.use("/api", settingsRoutes);
app.use("/api", tripayRoutes);
app.use('/api/tripay', tripayTestRoutes);
app.use('/api/subscriptions', subscriptionDemoRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  
  // Jangan tampilkan stack trace di production
  const errorDetails = process.env.NODE_ENV === 'production' ? {} : { stack: err.stack };
  
  res.status(500).json({
    success: false,
    message: "Terjadi kesalahan pada server",
    error: process.env.NODE_ENV === 'production' ? undefined : err.message,
    ...errorDetails
  });
});

// Catch 404 and forward to error handler
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint tidak ditemukan" });
});

// Start server
app.listen(PORT, async () => {
  try {
    await db.sequelize.authenticate();
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  } catch (error) {
    console.error("❌ Gagal menyambungkan database:", error);
  }
});