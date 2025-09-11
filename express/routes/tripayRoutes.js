const express = require("express");
const router = express.Router();
const tripayController = require("../controllers/tripayController");
const { authenticateUser, requireAdmin } = require("../middlewares/auth");


// Route untuk menerima callback dari server VPS
router.post("/tripay/internal-callback", (req, res) => {
  // Verifikasi token internal
  const internalToken = req.headers['x-internal-token'];
  
  if (internalToken !== process.env.INTERNAL_TOKEN) {
    console.error("Invalid internal token received from:", req.ip);
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }
  
  console.log("Received forwarded callback from VPS:", req.ip);
  
  // Proses callback seperti biasa
  tripayController.handleCallback(req, res);
});

router.post("/tripay/simulate-callback/:reference", authenticateUser, requireAdmin, tripayController.simulateCallback);
router.get("/tripay/callback-logs", authenticateUser, requireAdmin, tripayController.getCallbackLogs);
router.get("/tripay/debug-transaction/:reference", authenticateUser, tripayController.debugTransaction);
// Endpoint untuk mendapatkan metode pembayaran yang tersedia
router.get("/tripay/payment-channels", authenticateUser, tripayController.getPaymentChannels);

// Endpoint untuk membuat transaksi baru
router.post("/tripay/create-transaction", authenticateUser, tripayController.createTransaction);

// Endpoint untuk mendapatkan detail transaksi
router.get("/tripay/transaction-detail/:reference", authenticateUser, tripayController.getTransactionDetail);

// Endpoint untuk callback dari Tripay (tidak memerlukan autentikasi)
// Perbaikan: handleCallback sudah diekspor dengan benar dari tripayController
router.post("/tripay/callback", tripayController.handleCallback);

// Endpoint untuk memeriksa status transaksi
router.get("/tripay/transaction-status/:reference", authenticateUser, tripayController.getTransactionStatus);

// Endpoint untuk mendapatkan transaksi yang belum dibayar (pending)
router.get("/tripay/pending-transactions", authenticateUser, tripayController.getPendingTransactions);

// Endpoint untuk mendapatkan riwayat transaksi
router.get("/tripay/transaction-history", authenticateUser, tripayController.getTransactionHistory);

// Endpoint khusus admin untuk mendapatkan semua transaksi
router.get("/tripay/all-transactions", authenticateUser, requireAdmin, tripayController.getAllTransactions);

// Endpoint untuk mengatur status Tripay (aktif/nonaktif)
router.post("/settings/tripay", authenticateUser, requireAdmin, tripayController.updateTripayStatus);

// Endpoint untuk mendapatkan status Tripay
router.get("/settings/tripay-status", tripayController.getTripayStatus);

router.post("/tripay/update-pending-transactions", authenticateUser, tripayController.updatePendingTransactions);

module.exports = router;