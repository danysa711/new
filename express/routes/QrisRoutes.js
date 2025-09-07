// routes/QrisRoutes.js (modifikasi)
const express = require("express");
const router = express.Router();
const QrisController = require("../controllers/QrisController");
const { authenticateUser, requireAdmin } = require("../middlewares/auth");
const multer = require('multer');
const upload = multer();

// Middleware untuk semua routes
router.use(authenticateUser);

// User routes
router.get("/qris/pending", QrisController.getPendingPayments);
router.get("/qris/history", QrisController.getPaymentHistory);
router.post("/qris/create", QrisController.createPayment);
router.post("/qris/confirm/:id", QrisController.confirmPayment);
router.get("/qris/status/:id", QrisController.checkPaymentStatus);
router.get("/qris/image", QrisController.getQrisImage);

// Admin routes
router.get("/qris/pending-admin", requireAdmin, QrisController.getPendingPaymentsAdmin);
router.get("/qris/history-admin", requireAdmin, QrisController.getPaymentHistoryAdmin);
router.post("/qris/verify/:id", requireAdmin, QrisController.verifyPayment);
router.post("/qris/reject/:id", requireAdmin, QrisController.rejectPayment);
router.get("/qris/settings", requireAdmin, QrisController.getQrisSettings);
router.post("/qris/settings", requireAdmin, QrisController.saveQrisSettings);

// Gunakan metode alternatif untuk upload gambar (tanpa multer)
// Comment out atau hapus baris yang menggunakan multer
// router.post("/qris/upload-image", requireAdmin, upload.single('qrisImage'), QrisController.uploadQrisImage);

// Gunakan pendekatan alternatif (jika QrisController sudah memiliki metode ini)
router.post("/qris/upload-image", requireAdmin, upload.single('qrisImage'), QrisController.uploadQrisImage);

module.exports = router;