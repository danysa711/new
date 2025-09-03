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