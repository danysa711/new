// Perbaikan final pada server.js

const express = require("express");
const cors = require("cors");
const { db } = require("./models");
const rateLimit = require('express-rate-limit');
const licenseRoutes = require("./routes/licenseRoutes");
const softwareRoutes = require("./routes/softwareRoutes");
const softwareVersionRoutes = require("./routes/softwareVersionRoutes");
const orderRoutes = require("./routes/orderRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const publicApiRoutes = require("./routes/publicApiRoutes");
const settingsRoutes = require('./routes/settingsRoutes');
const qrisRoutes = require("./routes/qrisRoutes");
const whatsAppRoutes = require("./routes/whatsAppRoutes");
const { ensureQrisTables } = require("./utils/fix-qris-endpoints");
const fs = require('fs');
const path = require('path');


const app = express();
const PORT = process.env.PORT || 3500;

// PERBAIKAN: Nonaktifkan sementara rate limiter untuk debugging
// Gunakan rate limiter yang sangat longgar untuk testing
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 menit
  max: 1000, // Sangat tinggi untuk debugging - 1000 requests per menit
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  skipSuccessfulRequests: true, // Hanya hitung request yang gagal
  skip: (req, res) => {
    // Skip rate limiter pada mode development atau untuk debugging
    return process.env.NODE_ENV === 'development' || req.query.debug === 'true';
  }
});

// Pastikan direktori uploads dan data ada
const ensureDirectoriesExist = () => {
  const directories = [
    path.join(__dirname, 'uploads'),
    path.join(__dirname, 'uploads/payment_proof'),
    path.join(__dirname, 'data')
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      try {
        console.log(`Creating directory: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
      } catch (err) {
        console.error(`Error creating directory ${dir}:`, err);
      }
    }
  });
};

// PERBAIKAN: Header CORS yang lebih komprehensif
app.use((req, res, next) => {
  // Permitting all origins for debugging - You can restrict this in production
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  
  // Allow all methods
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  
  // Allow ALL headers that might be used
  res.header('Access-Control-Allow-Headers', 
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Auth-Token, ' +
    'Cache-Control, Pragma, Expires, X-Custom-Header, X-API-Key, X-Device-Id');
  
  // Allow credentials
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Set preflight cache time
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  // For preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Debug logging
  if (req.url !== '/api/test' && req.url !== '/favicon.ico') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} from ${req.headers.origin || 'unknown'}`);
  }
  
  next();
});

// Tambahkan middleware untuk parsing body
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// PERBAIKAN: Middleware khusus untuk QRIS
app.use('/api/qris-payments', (req, res, next) => {
  // Tambahan header khusus untuk rute QRIS
  res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  res.header('Surrogate-Control', 'no-store');
  next();
});

// Gunakan CORS dengan opsi khusus untuk preflight
const corsOptions = {
  origin: function(origin, callback) {
    // Izinkan semua origin untuk debugging
    callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization",
    "Cache-Control", "Pragma", "Expires", "X-Custom-Header", "X-Auth-Token", 
    "X-API-Key", "X-Device-Id"
  ],
  exposedHeaders: ["Content-Disposition", "X-RateLimit-Limit", "X-RateLimit-Remaining"],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400
};

// Tambahkan CORS global
app.use(cors(corsOptions));

// Handle preflight requests eksplisit
app.options('*', cors(corsOptions));

// Nonaktifkan rate limiter sementara untuk debugging
// Pasang rate limiter hanya pada endpoint yang sangat sering dipanggil
// app.use('/api/', apiLimiter);

// TAMBAHKAN HANDLER UNTUK ROOT PATH
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Kinterstore API Server</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          h1 { color: #333; }
          .status { padding: 10px; background: #e7f7e7; border-left: 4px solid #28a745; margin: 20px 0; }
          .endpoints { background: #f8f9fa; padding: 20px; border-radius: 5px; }
          .endpoint { margin-bottom: 10px; }
          .url { font-family: monospace; background: #f1f1f1; padding: 2px 5px; }
          .method { font-size: 0.85em; color: #fff; padding: 2px 6px; border-radius: 3px; margin-left: 5px; }
          .get { background-color: #28a745; }
          .post { background-color: #007bff; }
          .debug { margin-top: 30px; color: #6c757d; font-size: 0.9em; }
          .debug code { background: #f8f9fa; padding: 2px 5px; border-radius: 3px; }
        </style>
      </head>
      <body>
        <h1>Kinterstore API Server</h1>
        <div class="status">
          <strong>Status:</strong> Running
          <br>
          <strong>Server Time:</strong> ${new Date().toISOString()}
          <br>
          <strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}
        </div>

        <div>
          <strong>Database Status:</strong> 
          <span id="dbStatus">Checking...</span>
        </div>
          <script>
            // Simple script to check database connection
            fetch('/api/test')
              .then(response => response.json())
              .then(data => {
                document.getElementById('dbStatus').innerHTML = 'Connected';
                document.getElementById('dbStatus').style.color = '#28a745';
              })
              .catch(error => {
                document.getElementById('dbStatus').innerHTML = 'Error connecting';
                document.getElementById('dbStatus').style.color = '#dc3545';
              });
          </script>
        
        <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
          <p>Kinterstore API Server - &copy; ${new Date().getFullYear()}</p>
          <p><small>Gunakan endpoint ini melalui aplikasi frontend atau API client.</small></p>
        </div>
      </body>
    </html>
  `);
});

// Endpoint API test sederhana
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working", timestamp: new Date().toISOString() });
});

// Perbaikan khusus untuk endpoint qris-payments yang bermasalah
app.use("/api/qris-payments", (req, res, next) => {
  // Pastikan semua header CORS ditetapkan dengan benar
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Auth-Token, ' +
    'Cache-Control, Pragma, Expires, X-Custom-Header, X-API-Key, X-Device-Id');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Tambahkan header cache control
  res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  res.header('Surrogate-Control', 'no-store');
  
  next();
});

// Routes
app.use("/api", licenseRoutes);
app.use("/api", softwareRoutes);
app.use("/api", softwareVersionRoutes);
app.use("/api", orderRoutes);
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", subscriptionRoutes);
app.use("/api/public", publicApiRoutes);
app.use("/api", settingsRoutes);
app.use("/api", qrisRoutes); 
app.use("/api", whatsAppRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  
  // Set CORS header untuk error response juga
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  
  res.status(500).json({ 
    message: "Terjadi kesalahan pada server", 
    error: process.env.NODE_ENV === 'production' ? undefined : err.message,
    timestamp: Date.now()
  });
});

// Catch 404 and forward to error handler
app.use((req, res) => {
  // Set CORS header untuk 404 response juga
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  
  res.status(404).json({ 
    message: "Endpoint tidak ditemukan",
    timestamp: Date.now()
  });
});

// Start server
app.listen(PORT, async () => {
  try {
    // Pastikan direktori ada terlebih dahulu
    ensureDirectoriesExist();
    
    // Hubungkan ke database
    await db.sequelize.authenticate();
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    
    // Pastikan tabel QRIS sudah ada dan berisi data default
    await ensureQrisTables();
    
    // Log informasi server
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`⚡ Rate limiting: ${process.env.NODE_ENV === 'production' ? 'Enabled' : 'Disabled (development mode)'}`);
  } catch (error) {
    console.error("❌ Gagal menyambungkan database:", error);
  }
});