const express = require("express");
const { getSettings, updateWhatsAppSettings, updateCompanySettings } = require("../controllers/settingsController");
const { authenticateUser, requireAdmin } = require("../middlewares/auth");

const router = express.Router();

// Route GET settings dapat diakses semua user yang terautentikasi - TANPA requireActiveSubscription
router.get("/settings", authenticateUser, getSettings);

// Routes untuk update settings memerlukan hak admin
router.put("/settings/whatsapp", authenticateUser, requireAdmin, updateWhatsAppSettings);
router.put("/settings/company", authenticateUser, requireAdmin, updateCompanySettings);

module.exports = router;