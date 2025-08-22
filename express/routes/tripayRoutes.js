// express/routes/tripayRoutes.js
const express = require("express");
const {
  getTripaySettings,
  updateTripaySettings,
  getPaymentChannels,
  createTransaction,
  getTransactionDetails,
  handleCallback
} = require("../controllers/tripayController");
const { authenticateUser, isAdmin } = require("../middlewares/auth");

const router = express.Router();

// Admin routes
router.get("/tripay/settings", authenticateUser, isAdmin, getTripaySettings);
router.post("/tripay/settings", authenticateUser, isAdmin, updateTripaySettings);

// User routes
router.get("/tripay/channels", authenticateUser, getPaymentChannels);
router.post("/tripay/transaction", authenticateUser, createTransaction);
router.get("/tripay/transaction/:reference", authenticateUser, getTransactionDetails);

// Callback route (no auth required, will be called by Tripay)
router.post("/tripay/callback", handleCallback);

module.exports = router;