// express/routes/paymentSettingsRoutes.js
const express = require("express");
const {
  getPaymentSettings,
  updatePaymentSettings,
  getQrisImage,
  updateQrisImageUrl,
  resetSettings
} = require("../controllers/paymentSettingsController");
const { authenticateUser, requireAdmin } = require("../middlewares/auth");

const router = express.Router();

// Rute publik untuk mendapatkan gambar QRIS
router.get("/payment-settings/qris-image", getQrisImage);

// Routes yang memerlukan autentikasi
router.use(authenticateUser);

// Get pengaturan (semua user bisa)
router.get("/payment-settings", getPaymentSettings);

// Rute khusus admin
router.put("/payment-settings", requireAdmin, updatePaymentSettings);
router.put("/payment-settings/qris-url", requireAdmin, updateQrisImageUrl);
router.post("/payment-settings/reset", requireAdmin, resetSettings);

module.exports = router;