// Perbaikan untuk express/server.js

const express = require("express");
const cors = require("cors");
const { db } = require("./models");

const licenseRoutes = require("./routes/licenseRoutes");
const softwareRoutes = require("./routes/softwareRoutes");
const softwareVersionRoutes = require("./routes/softwareVersionRoutes");
const orderRoutes = require("./routes/orderRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const tripayRoutes = require("./routes/tripayRoutes");
const publicApiRoutes = require("./routes/publicApiRoutes");
const settingsRoutes = require('./routes/settingsRoutes');
const paymentMethodRoutes = require('./routes/paymentMethodRoutes');

const app = express();
const PORT = process.env.PORT || 3500;

// Definisikan corsOptions dengan semua domain yang diizinkan
const corsOptions = {
  origin: function(origin, callback) {
    // Daftar domain yang diperbolehkan
    const allowedOrigins = [
      "https://kinterstore.my.id",       
      "https://www.kinterstore.my.id", 
      "https://db.kinterstore.my.id",
      "http://localhost:3000",           
      "http://localhost:5173",           
      "http://localhost:5174"            
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      console.log('Origin rejected by CORS:', origin);
      // Izinkan semua origin untuk sementara selama debugging
      callback(null, true);
      // Setelah debugging selesai, kembalikan ke:
      // callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200
};

// Tambahkan middleware untuk debugging CORS
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Request origin:', req.headers.origin);
  console.log('Request headers:', req.headers);
  
  // Pastikan headers CORS selalu ditambahkan
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const requestInfo = {
    method: req.method,
    url: req.url,
    userId: req.userId || 'not authenticated',
    userRole: req.userRole || 'not authenticated',
    timestamp: new Date().toISOString()
  };

  console.log("REQUEST:", JSON.stringify(requestInfo));
  
  next();
});

// Gunakan CORS di seluruh aplikasi
app.use(cors(corsOptions));

// Tambahkan middleware untuk parsing body
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Tambahkan middleware khusus untuk preflight requests
app.options('*', cors(corsOptions));

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

            <strong>Database Status:</strong> 
            <span id="dbStatus">Checking...</span>
          </p>
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
        </div>
        
        <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
          <p>Kinterstore API Server - &copy; ${new Date().getFullYear()}</p>
          <p><small>Gunakan endpoint ini melalui aplikasi frontend atau API client.</small></p>
        </div>
      </body>
    </html>
  `);
});

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working", timestamp: new Date().toISOString() });
});

// Endpoint global untuk payment-methods
app.get('/api/payment-methods', async (req, res) => {
  try {
    // Data default
    let methods = [
      // Manual methods (default)
      {
        code: 'MANUAL_1',
        name: 'Transfer Bank BCA',
        type: 'bank',
        fee: 0,
        isManual: true,
        manualData: {
          id: 1,
          name: 'Transfer Bank BCA',
          type: 'bank',
          accountNumber: '1234567890',
          accountName: 'PT Demo Store',
          instructions: 'Transfer ke rekening BCA a/n PT Demo Store',
          isActive: true
        }
      },
      {
        code: 'MANUAL_2',
        name: 'QRIS',
        type: 'qris',
        fee: 0,
        isManual: true,
        manualData: {
          id: 2,
          name: 'QRIS',
          type: 'qris',
          qrImageUrl: 'https://example.com/qr.png',
          instructions: 'Scan kode QR menggunakan aplikasi e-wallet atau mobile banking',
          isActive: true
        }
      }
    ];
    
    // Cek apakah Tripay diaktifkan
    try {
      const tripayEnabled = await db.Setting.findOne({ where: { key: 'tripay_enabled' } });
      if (tripayEnabled && tripayEnabled.value === 'true') {
        // Tambahkan metode Tripay
        const tripayMethods = [
          { code: 'QRIS', name: 'QRIS', type: 'qris', fee: 800 },
          { code: 'BRIVA', name: 'Bank BRI', type: 'bank', fee: 4000 },
          { code: 'MANDIRIVA', name: 'Bank Mandiri', type: 'bank', fee: 4000 },
          { code: 'BNIVA', name: 'Bank BNI', type: 'bank', fee: 4000 },
          { code: 'BCAVA', name: 'Bank BCA', type: 'bank', fee: 4000 },
          { code: 'OVO', name: 'OVO', type: 'ewallet', fee: 2000 },
          { code: 'DANA', name: 'DANA', type: 'ewallet', fee: 2000 },
          { code: 'LINKAJA', name: 'LinkAja', type: 'ewallet', fee: 2000 },
          { code: 'SHOPEEPAY', name: 'ShopeePay', type: 'ewallet', fee: 2000 }
        ];
        methods = [...tripayMethods, ...methods];
      }
    } catch (settingError) {
      console.error('Error checking Tripay status:', settingError);
      // Anggap Tripay tidak aktif
    }
    
    res.json(methods);
  } catch (error) {
    console.error('Error in payment methods endpoint:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Routes
app.use("/api", licenseRoutes);
app.use("/api", softwareRoutes);
app.use("/api", softwareVersionRoutes);
app.use("/api", orderRoutes);
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", subscriptionRoutes);
app.use("/api/tripay", tripayRoutes);
app.use("/api/public", publicApiRoutes);
app.use("/api", settingsRoutes);
app.use("/api", paymentMethodRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ 
    message: "Terjadi kesalahan pada server", 
    error: process.env.NODE_ENV === 'production' ? undefined : err.message 
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