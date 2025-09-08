// File: /volume1/homes/vins/web/express/server.js

// Tambahkan semua import yang diperlukan di bagian atas
const express = require("express");
const cors = require("cors");
const fs = require('fs');
const path = require('path');
const { db } = require("./models");
const { startScheduler } = require('./utils/scheduler');
const homeRoutes = require("./routes/homeRoutes"); // Interface Domain Backend
// Import routes
const licenseRoutes = require("./routes/licenseRoutes");
const softwareRoutes = require("./routes/softwareRoutes");
const softwareVersionRoutes = require("./routes/softwareVersionRoutes");
const orderRoutes = require("./routes/orderRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const publicApiRoutes = require("./routes/publicApiRoutes");
const settingsRoutes = require('./routes/settingsRoutes');
const QrisRoutes = require("./routes/QrisRoutes");
const baileysRoutes = require("./routes/BaileysRoutes");

// Mulai scheduler
startScheduler();

const app = express();
const PORT = process.env.PORT || 3500;

// Pastikan direktori uploads ada
const uploadsDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Pastikan direktori baileys_auth ada
const baileysAuthDir = path.join(__dirname, 'baileys_auth');
if (!fs.existsSync(baileysAuthDir)) {
  fs.mkdirSync(baileysAuthDir, { recursive: true });
}

// Definisikan corsOptions dengan semua domain yang diizinkan
const corsOptions = {
  origin: '*', // Izinkan semua origin untuk debugging
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400 // Cache preflight request selama 24 jam
};

// Gunakan CORS di seluruh aplikasi dengan opsi yang baru
app.use(cors(corsOptions));

// Ganti middleware debug dengan versi yang lebih sederhana
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.headers.origin || 'No Origin'}`);
  
  // Tambahkan header CORS secara manual untuk memastikan
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Tambahkan endpoint test khusus untuk verifikasi koneksi
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API is working', 
    timestamp: new Date().toISOString(),
    server: 'express',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Tambahkan endpoint khusus untuk mengecek status admin
app.get('/api/admin-check', (req, res) => {
  const token = req.header("Authorization")?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ error: "Unauthorized, token missing" });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "mysecretkey");
    
    res.json({
      success: true,
      isAdmin: decoded.role === 'admin' || decoded.userId === 'admin',
      userId: decoded.id,
      role: decoded.role
    });
  } catch (error) {
    return res.status(403).json({ error: "Invalid token", details: error.message });
  }
});

// Tambahkan middleware untuk menyajikan file statis
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

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

// Middleware untuk parsing body
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Middleware khusus untuk preflight requests
app.options('*', cors(corsOptions));

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
app.use("/api", QrisRoutes);
app.use("/api", baileysRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ 
    message: "Terjadi kesalahan pada server", 
    error: process.env.NODE_ENV === 'production' ? undefined : err.message 
  });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Global error handler caught:", err);
  
  // Log error stack untuk debugging
  console.error(err.stack);
  
  // Jangan mengekspos informasi stack error ke client di production
  const response = {
    message: "Terjadi kesalahan pada server",
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    path: req.path,
    method: req.method
  };
  
  res.status(500).json(response);
});

// Catch 404 and forward to error handler
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint tidak ditemukan" });
});

// Fungsi untuk memastikan QrisSettings ada
const ensureQrisSettings = async () => {
  try {
    const { QrisSettings } = db; // Ambil dari db bukan require langsung
    
    if (!QrisSettings) {
      console.error('QrisSettings model not found');
      return;
    }
    
    // Cek apakah sudah ada setting
    const existingSettings = await QrisSettings.findOne();
    
    if (!existingSettings) {
      console.log('Inisialisasi QrisSettings...');
      await QrisSettings.create({
        expiry_hours: 1,
        qris_image: null
      });
      console.log('QrisSettings berhasil diinisialisasi');
    }
  } catch (err) {
    console.error('Error memastikan QrisSettings:', err);
  }
};


// Start server
app.listen(PORT, async () => {
  try {
    await db.sequelize.authenticate();
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    
    // Pastikan QrisSettings ada
    await ensureQrisSettings();
  } catch (error) {
    console.error("❌ Gagal menyambungkan database:", error);
  }
});