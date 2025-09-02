// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateUser, requireAdmin } = require('../middlewares/auth');
const {
  getAllPaymentMethods,
  getAllPaymentMethodsFallback,
  createManualTransaction,
  updateManualTransactionStatus,
  getUserActiveTransactions,
  getUserTransactionHistory,
  getTransactionByReference,
  filterTransactions
} = require('../controllers/paymentController');

// ====== Endpoint untuk Metode Pembayaran ======
// Mendapatkan semua metode pembayaran (publik)
router.get('/payment-methods', getAllPaymentMethods);

// ====== Endpoint untuk Transaksi ======
// Membuat transaksi manual
router.post('/transactions/manual', authenticateUser, createManualTransaction);

// Mengupdate status transaksi (Admin only)
router.put('/transactions/:reference/status', [authenticateUser, requireAdmin], updateManualTransactionStatus);

// Mendapatkan transaksi aktif user
router.get('/transactions/active', authenticateUser, getUserActiveTransactions);

// Mendapatkan riwayat transaksi user
router.get('/transactions/history', authenticateUser, getUserTransactionHistory);

// Mendapatkan detail transaksi berdasarkan reference
router.get('/transactions/:reference', authenticateUser, getTransactionByReference);

// Filter transaksi (Admin only)
router.post('/transactions/filter', [authenticateUser, requireAdmin], filterTransactions);

module.exports = router;