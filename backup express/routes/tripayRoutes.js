const express = require('express');
const { 
  getPaymentChannels, 
  calculateFee, 
  createTransaction, 
  getTransactionDetail, 
  handleCallback,
  getTripayConfig,
  saveTripayConfig,
  testTripayConnection,
  checkTransactionStatus
} = require('../controllers/tripayController');
const { authenticateUser, requireAdmin } = require('../middlewares/auth');

const router = express.Router();

// Public route for callback
router.post('/callback', handleCallback);

// Admin-only routes
router.get('/config', [authenticateUser, requireAdmin], getTripayConfig);
router.post('/config', [authenticateUser, requireAdmin], saveTripayConfig);
router.post('/test-connection', [authenticateUser, requireAdmin], testTripayConnection);

// Routes that require authentication
router.use(authenticateUser);
router.get('/payment-channels', getPaymentChannels);
router.post('/calculate-fee', calculateFee);
router.post('/create-transaction', createTransaction);
router.get('/transaction/:reference', getTransactionDetail);
router.get('/transaction/:reference/check', checkTransactionStatus);

module.exports = router;