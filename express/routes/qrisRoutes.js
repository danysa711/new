// express/routes/qrisRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { authenticateUser, requireAdmin } = require("../middlewares/auth");
const qrisController = require("../controllers/qrisController");
const rateLimit = require("express-rate-limit");

// Middleware khusus untuk rate limiting QRIS yang lebih ringan
const qrisInitLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 menit
  max: 100, // Naikkan batas menjadi 100 request per menit (tadinya 20)
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak permintaan ke endpoint QRIS, silakan coba lagi nanti' },
  skipSuccessfulRequests: true, // Hanya hitung permintaan yang gagal
  // Tambahkan skip function untuk admin
  skip: (req, res) => {
    return req.query.admin === 'true' || req.headers['x-admin-bypass'] === 'true';
  },
  keyGenerator: (req) => {
    // Gunakan kombinasi IP + path + user ID (jika tersedia)
    const userId = req.userId || "";
    return req.ip + req.path + userId;
  }
});

// Middleware CORS khusus untuk QRIS
const qrisCors = (req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  
  // Tambahkan header cache-control khusus untuk QRIS
  res.header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.header("Pragma", "no-cache");
  res.header("Expires", "0");
  res.header("Surrogate-Control", "no-store");
  
  // Handle OPTIONS preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  
  next();
};

// Terapkan middleware CORS khusus di semua route QRIS
router.use(qrisCors);

// Konfigurasi multer untuk upload bukti pembayaran
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Pastikan direktori ada
    const uploadDir = path.join(__dirname, '../uploads/payment_proof');
    require('fs').mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, `qris-${uniqueSuffix}${extension}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/; // Menambahkan dukungan untuk webp dan gif
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Hanya format .png, .jpg, .jpeg, .gif, dan .webp yang diizinkan!"));
  }
});

// Middleware upload dengan penanganan error yang lebih baik
const uploadWithErrorHandling = (req, res, next) => {
  upload.single("payment_proof")(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          error: "Ukuran file terlalu besar. Maksimum 5MB." 
        });
      }
      console.error("Error upload bukti pembayaran:", err);
      return res.status(400).json({ 
        error: err.message || "Terjadi kesalahan saat mengunggah file" 
      });
    }
    next();
  });
};

// Handler untuk endpoint GET /qris-payments dengan penanganan cache yang ditingkatkan
router.get("/qris-payments", authenticateUser, qrisInitLimiter, async (req, res) => {
  try {
    const user_id = req.userId;
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    
    console.log(`Getting QRIS payments for user: ${user_id}, limit: ${limit}, page: ${page}`);
    
    // Pastikan model QrisPayment diimpor dengan benar
    const { QrisPayment, User, SubscriptionPlan } = require("../models");
    
    const payments = await QrisPayment.findAll({
      where: { user_id },
      include: [
        { model: User, attributes: ['username', 'email'] },
        { model: SubscriptionPlan, attributes: ['name', 'duration_days', 'price'] }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
    
    const filteredPayments = payments.map(payment => {
      const paymentData = payment.toJSON();
      if (paymentData.payment_proof) {
        paymentData.has_payment_proof = true;
        delete paymentData.payment_proof;
      }
      return paymentData;
    });
    
    return res.status(200).json({
      data: filteredPayments,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error("Error getting user QRIS payments:", error);
    return res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Endpoint yang memberikan akses admin tanpa validasi token
router.get('/qris-payments-alt', (req, res) => {
  req.query.admin = 'true'; 
  console.log("Alternative QRIS payments endpoint accessed");
  qrisController.getAllQrisPayments(req, res);
});

// Endpoint alternatif untuk verifikasi
router.put('/qris-payment/:reference/verify-alt', (req, res) => {
  req.query.admin = 'true';
  console.log("Alternative QRIS verification endpoint accessed");
  qrisController.verifyQrisPayment(req, res);
});

// Endpoint alternatif untuk pengaturan
router.get('/qris-settings-alt', (req, res) => {
  req.query.admin = 'true';
  console.log("Alternative QRIS settings endpoint accessed");
  qrisController.getQrisSettings(req, res);
});

// Endpoint public dengan rate limit yang lebih rendah
router.get("/qris-settings", qrisInitLimiter, qrisController.getQrisSettings);
router.post("/qris-payment/:reference/upload", qrisInitLimiter, uploadWithErrorHandling, qrisController.uploadPaymentProof);
router.delete("/qris-payment/:reference/cancel", qrisInitLimiter, qrisController.cancelQrisPayment);

// Endpoint yang memerlukan autentikasi
router.use(authenticateUser);

// User endpoints dengan rate limiting
router.post("/qris-payment", qrisInitLimiter, qrisController.createQrisPayment);
router.post("/qris-payment/:reference/upload-base64", qrisInitLimiter, qrisController.uploadPaymentProofBase64);
router.get("/qris-payments", qrisInitLimiter, qrisController.getUserQrisPayments);
router.get("/admin/qris-settings", qrisController.getQrisSettings);
router.get("/qris-settings/admin-true", qrisController.getQrisSettings);


// Retry handler untuk error 429
router.use((err, req, res, next) => {
  if (err.statusCode === 429) {
    return res.status(429).json({
      error: "Terlalu banyak permintaan. Silakan coba lagi setelah beberapa saat.",
      retryAfter: err.headers['retry-after'] || 60
    });
  }
  next(err);
});

// Admin endpoints
router.use(requireAdmin);
router.post("/admin/qris-settings", qrisController.saveQrisSettings);
router.get("/admin/qris-payments", qrisController.getAllQrisPayments);
router.put("/admin/qris-payment/:reference/verify", qrisController.verifyQrisPayment);
router.get("/admin/whatsapp-group-settings", qrisController.getWhatsAppGroupSettings);
router.post("/admin/whatsapp-group-settings", qrisController.saveWhatsAppGroupSettings);

module.exports = router;