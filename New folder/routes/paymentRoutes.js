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
  getTransactionByReference
} = require('../controllers/paymentController');

// Endpoint untuk mendapatkan semua metode pembayaran
router.get('/payment-methods', getAllPaymentMethodsFallback);

// Endpoint untuk membuat transaksi manual
router.post('/transactions/manual', authenticateUser, createManualTransaction);

// Endpoint untuk mengupdate status transaksi (Admin only)
router.put('/transactions/:reference/status', [authenticateUser, requireAdmin], updateManualTransactionStatus);

// Endpoint untuk mendapatkan transaksi aktif user
router.get('/transactions/active', authenticateUser, getUserActiveTransactions);

// Endpoint untuk mendapatkan riwayat transaksi user
router.get('/transactions/history', authenticateUser, getUserTransactionHistory);

// Endpoint untuk mendapatkan detail transaksi berdasarkan reference
router.get('/transactions/:reference', authenticateUser, getTransactionByReference);

module.exports = router;