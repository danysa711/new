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
  origin: [
    "*", // Izinkan semua origins
    "https://kinterstore.my.id",       // Tambahkan domain tanpa www
    "https://www.kinterstore.my.id", 
    "https://db.kinterstore.my.id",
    "http://localhost:3000",           // Untuk development
    "http://localhost:5173",           // Untuk Vite
    "http://localhost:5174"            // Untuk alternatif port Vite
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200
};

// Tambahkan middleware untuk logging request
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Request headers:', req.headers);
  next();
});

// Gunakan CORS di seluruh aplikasi
app.use(cors(corsOptions));

// Tambahkan middleware khusus untuk preflight requests
app.options('*', cors(corsOptions));

// Tambahkan middleware untuk parsing body JSON dengan limit lebih besar
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Tambahkan middleware untuk menangani CORS secara manual jika perlu
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Jika origin ada dalam daftar yang diizinkan
  if (corsOptions.origin.includes(origin) || corsOptions.origin.includes("*")) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', corsOptions.methods.join(', '));
    res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(', '));
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  next();
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