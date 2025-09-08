// routes/QrisRoutes.js (modifikasi dengan penambahan rute cancel)
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
router.post("/qris/cancel/:id", QrisController.cancelPayment); // Tambahkan rute baru untuk pembatalan
router.post("/qris/user-cancel/:id", QrisController.userCancelPayment); // Endpoint baru khusus pengguna
router.get("/qris/status/:id", QrisController.checkPaymentStatus);
router.get("/qris/image", QrisController.getQrisImage);

// Admin routes
router.get("/qris/pending-admin", requireAdmin, QrisController.getPendingPaymentsAdmin);
router.get("/qris/history-admin", requireAdmin, QrisController.getPaymentHistoryAdmin);
router.post("/qris/verify/:id", requireAdmin, QrisController.verifyPayment);
router.post("/qris/reject/:id", requireAdmin, QrisController.rejectPayment);
router.get("/qris/settings", requireAdmin, QrisController.getQrisSettings);
router.post("/qris/settings", requireAdmin, QrisController.saveQrisSettings);

// Upload gambar QRIS
router.post("/qris/upload-image", requireAdmin, upload.single('qrisImage'), QrisController.uploadQrisImage);
router.post("/qris/upload-image-base64", requireAdmin, QrisController.uploadQrisImageBase64);

module.exports = router;