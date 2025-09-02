// express/routes/whatsAppRoutes.js
const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middlewares/auth");
const whatsAppController = require("../controllers/whatsAppLoginController");

// Semua endpoint memerlukan autentikasi
router.use(authenticateUser);

router.get("/whatsapp/qr", whatsAppController.generateWhatsAppQR);
router.get("/whatsapp/status", whatsAppController.getWhatsAppStatus);
router.post("/whatsapp/logout", whatsAppController.logoutWhatsApp);
router.post("/whatsapp/connect", whatsAppController.connectWhatsApp);

module.exports = router;
