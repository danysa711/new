// express/routes/whatsappRoutes.js
const express = require("express");
const {
  initWhatsApp,
  getWhatsAppStatus,
  logoutWhatsApp,
  setAdminGroup,
  sendTestMessage
} = require("../controllers/whatsappController");
const { authenticateUser, requireAdmin } = require("../middlewares/auth");

const router = express.Router();

// Semua routes memerlukan autentikasi dan akses admin
router.use(authenticateUser, requireAdmin);

// Rute WhatsApp
router.post("/init", initWhatsApp);
router.get("/status", getWhatsAppStatus);
router.post("/logout", logoutWhatsApp);
router.post("/admin-group", setAdminGroup);
router.post("/test-message", sendTestMessage);

module.exports = router;