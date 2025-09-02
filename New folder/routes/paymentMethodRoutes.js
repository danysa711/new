// routes/paymentMethodRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateUser, requireAdmin } = require('../middlewares/auth');
const { 
  getManualPaymentMethods, 
  createPaymentMethod, 
  updatePaymentMethod,
  deletePaymentMethod,
  toggleTripayStatus,
  getTripayStatus
} = require('../controllers/paymentMethodController');

// @route   GET api/payment-methods/manual
// @desc    Get all manual payment methods (admin only)
// @access  Admin
router.get('/payment-methods/manual', [authenticateUser, requireAdmin], getManualPaymentMethods);

// @route   POST api/payment-methods
// @desc    Create a new payment method
// @access  Admin
router.post('/payment-methods', [authenticateUser, requireAdmin], createPaymentMethod);

// @route   PUT api/payment-methods/:id
// @desc    Update a payment method
// @access  Admin
router.put('/payment-methods/:id', [authenticateUser, requireAdmin], updatePaymentMethod);

// @route   DELETE api/payment-methods/:id
// @desc    Delete a payment method
// @access  Admin
router.delete('/payment-methods/:id', [authenticateUser, requireAdmin], deletePaymentMethod);

// @route   POST api/settings/tripay
// @desc    Toggle Tripay status (enable/disable)
// @access  Admin
router.post('/settings/tripay', [authenticateUser, requireAdmin], toggleTripayStatus);

// @route   GET api/settings/tripay-status
// @desc    Get Tripay status
// @access  Public
router.get('/settings/tripay-status', getTripayStatus);

module.exports = router;