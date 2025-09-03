// express/routes/qrisSettingsRoutes.js

const express = require("express");
const router = express.Router();
const qrisController = require("../controllers/qrisController");
const { authenticateUser, isAdmin } = require("../middlewares/auth");

// Endpoint publik - dapat diakses tanpa autentikasi
router.get("/qris-public", (req, res) => {
  console.log("Public QRIS settings endpoint accessed");
  qrisController.getQrisSettings(req, res);
});

// Endpoint dengan parameter admin=true
router.get("/qris-settings", (req, res) => {
  console.log("QRIS settings endpoint accessed with query:", req.query);
  qrisController.getQrisSettings(req, res);
});

// Endpoint admin - memerlukan autentikasi
router.get("/admin/qris-settings", (req, res) => {
  console.log("Admin QRIS settings endpoint accessed");
  qrisController.getQrisSettings(req, res);
});

// Endpoint untuk menyimpan pengaturan (admin only)
router.post("/admin/qris-settings", authenticateUser, isAdmin, qrisController.saveQrisSettings);

module.exports = router;