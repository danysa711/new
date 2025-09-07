// routes/BaileysRoutes.js
const express = require("express");
const router = express.Router();
const BaileysController = require("../controllers/BaileysController");
const { authenticateUser, requireAdmin } = require("../middlewares/auth");

// Middleware untuk semua routes
router.use(authenticateUser);
router.use(requireAdmin); // Semua routes memerlukan admin

// Admin routes
router.get("/baileys/settings", BaileysController.getSettings);
router.post("/baileys/settings", BaileysController.saveSettings);
router.post("/baileys/connect", BaileysController.connect);
router.post("/baileys/disconnect", BaileysController.disconnect);
router.get("/baileys/status", BaileysController.getStatus);
router.get("/baileys/logs", BaileysController.getLogs);

module.exports = router;