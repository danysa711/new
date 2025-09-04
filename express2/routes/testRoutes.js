// express/routes/testRoutes.js

const express = require("express");
const router = express.Router();
const testController = require("../controllers/testController");

// Test routes
router.get("/test", testController.testConnection);
router.get("/test/qris-settings", testController.testQrisSettings);
router.get("/test/qris-payments", testController.testQrisPayments);

module.exports = router;