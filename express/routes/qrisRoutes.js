// express/routes/qrisRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { authenticateUser, requireAdmin } = require("../middlewares/auth");
const qrisController = require("../controllers/qrisController");

// Konfigurasi multer untuk upload bukti pembayaran
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Pastikan direktori ada
    const uploadDir = path.join(__dirname, '../uploads/payment_proof');
    require('fs').mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
  }
});

router.get("/qris-payments", authenticateUser, async (req, res) => {
  try {
    const user_id = req.userId;
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    
    console.log(`Getting QRIS payments for user: ${user_id}, limit: ${limit}, page: ${page}`);
    
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
    
    // Menghapus data payment_proof dari response untuk mengurangi ukuran data
    const filteredPayments = payments.map(payment => {
      const paymentData = payment.toJSON();
      // Jika ada payment proof, ganti dengan flag saja bukan base64 lengkap
      if (paymentData.payment_proof) {
        paymentData.has_payment_proof = true;
        delete paymentData.payment_proof;
      }
      return paymentData;
    });
    
    console.log(`Found ${payments.length} QRIS payments`);
    
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    
    return res.status(200).json(filteredPayments);
  } catch (error) {
    console.error("Error getting user QRIS payments:", error);
    return res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Endpoint public
router.get("/qris-settings", qrisController.getQrisSettings);

// Endpoint yang memerlukan autentikasi
router.use(authenticateUser);

// User endpoints
router.post("/qris-payment", qrisController.createQrisPayment);
router.post("/qris-payment/:reference/upload", upload.single("payment_proof"), qrisController.uploadPaymentProof);
router.post("/qris-payment/:reference/upload-base64", qrisController.uploadPaymentProofBase64);
router.get("/qris-payments", qrisController.getUserQrisPayments);

// Admin endpoints
router.use(requireAdmin);
router.post("/admin/qris-settings", qrisController.saveQrisSettings);
router.get("/admin/qris-payments", qrisController.getAllQrisPayments);
router.put("/admin/qris-payment/:reference/verify", qrisController.verifyQrisPayment);
router.get("/admin/whatsapp-group-settings", qrisController.getWhatsAppGroupSettings);
router.post("/admin/whatsapp-group-settings", qrisController.saveWhatsAppGroupSettings);

module.exports = router;