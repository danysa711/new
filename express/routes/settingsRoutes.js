// File: express/routes/settingsRoutes.js
const express = require("express");
const { getSettings, updateWhatsAppSettings, updateCompanySettings } = require("../controllers/settingsController");
const { authenticateUser, requireAdmin } = require("../middlewares/auth");

const router = express.Router();

// Semua routes ini memerlukan autentikasi dan hak admin
router.use(authenticateUser, requireAdmin);

router.get("/settings", getSettings);
router.put("/settings/whatsapp", updateWhatsAppSettings);
router.put("/settings/company", updateCompanySettings);

module.exports = router;