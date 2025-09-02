const express = require('express');
const { 
  getPaymentChannels, 
  calculateFee, 
  createTransaction, 
  getTransactionDetail, 
  handleCallback 
} = require('../controllers/tripayController');
const { 
  getAllPaymentMethods, 
  getAllPaymentMethodsFallback 
} = require('../controllers/paymentMethodController');
const { authenticateUser } = require('../middlewares/auth');

const router = express.Router();

// Public route for callback
router.post('/callback', handleCallback);

// Endpoint baru untuk payment-methods
router.get('/payment-methods', getAllPaymentMethodsFallback);

// Protected routes
router.use(authenticateUser);
router.get('/payment-channels', getPaymentChannels);
router.post('/calculate-fee', calculateFee);
router.post('/create-transaction', createTransaction);
router.get('/transaction/:reference', getTransactionDetail);

module.exports = router;