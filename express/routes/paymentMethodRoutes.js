// routes/paymentMethodRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateUser, requireAdmin } = require('../middlewares/auth');
const { PaymentMethod, Setting } = require('../models');

// @route   GET api/payment-methods/manual
// @desc    Get all manual payment methods (admin only)
// @access  Admin
router.get('/payment-methods/manual', [authenticateUser, requireAdmin], async (req, res) => {
  try {
    const manualMethods = await PaymentMethod.findAll();
    res.json(manualMethods);
  } catch (err) {
    console.error('Error fetching manual payment methods:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST api/payment-methods
// @desc    Create a new payment method
// @access  Admin
router.post('/payment-methods', [authenticateUser, requireAdmin], async (req, res) => {
  try {
    const {
      name,
      type,
      accountNumber,
      accountName,
      instructions,
      qrImageUrl,
      isActive
    } = req.body;
    
    const newMethod = await PaymentMethod.create({
      name,
      type,
      accountNumber,
      accountName,
      instructions,
      qrImageUrl,
      isActive: isActive || true
    });
    
    res.status(201).json(newMethod);
  } catch (err) {
    console.error('Error creating payment method:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT api/payment-methods/:id
// @desc    Update a payment method
// @access  Admin
router.put('/payment-methods/:id', [authenticateUser, requireAdmin], async (req, res) => {
  try {
    const {
      name,
      type,
      accountNumber,
      accountName,
      instructions,
      qrImageUrl,
      isActive
    } = req.body;
    
    const method = await PaymentMethod.findByPk(req.params.id);
    
    if (!method) {
      return res.status(404).json({ message: 'Payment method not found' });
    }
    
    // Update fields
    if (name) method.name = name;
    if (type) method.type = type;
    if (accountNumber !== undefined) method.accountNumber = accountNumber;
    if (accountName !== undefined) method.accountName = accountName;
    if (instructions !== undefined) method.instructions = instructions;
    if (qrImageUrl !== undefined) method.qrImageUrl = qrImageUrl;
    if (isActive !== undefined) method.isActive = isActive;
    
    await method.save();
    
    res.json(method);
  } catch (err) {
    console.error('Error updating payment method:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE api/payment-methods/:id
// @desc    Delete a payment method
// @access  Admin
router.delete('/payment-methods/:id', [authenticateUser, requireAdmin], async (req, res) => {
  try {
    const method = await PaymentMethod.findByPk(req.params.id);
    
    if (!method) {
      return res.status(404).json({ message: 'Payment method not found' });
    }
    
    await method.destroy();
    
    res.json({ message: 'Payment method deleted' });
  } catch (err) {
    console.error('Error deleting payment method:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;