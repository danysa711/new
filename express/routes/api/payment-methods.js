// 1. Buat endpoint API baru di backend
// File: /routes/api/payment-methods.js

const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const PaymentMethod = require('../../models/PaymentMethod');

// @route   GET api/payment-methods
// @desc    Get all active payment methods
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Ambil pengaturan Tripay dari database
    const tripayEnabled = await Setting.findOne({ key: 'tripay_enabled' });
    
    // Ambil semua metode pembayaran manual yang aktif
    const manualMethods = await PaymentMethod.find({ isActive: true });
    
    // Metode pembayaran Tripay yang tersedia
    let tripayMethods = [];
    if (tripayEnabled && tripayEnabled.value === 'true') {
      tripayMethods = [
        { code: 'QRIS', name: 'QRIS', type: 'qris', fee: 800 },
        { code: 'BRIVA', name: 'Bank BRI', type: 'bank', fee: 4000 },
        { code: 'MANDIRIVA', name: 'Bank Mandiri', type: 'bank', fee: 4000 },
        { code: 'BNIVA', name: 'Bank BNI', type: 'bank', fee: 4000 },
        { code: 'BCAVA', name: 'Bank BCA', type: 'bank', fee: 4000 },
        { code: 'OVO', name: 'OVO', type: 'ewallet', fee: 2000 },
        { code: 'DANA', name: 'DANA', type: 'ewallet', fee: 2000 },
        { code: 'LINKAJA', name: 'LinkAja', type: 'ewallet', fee: 2000 },
        { code: 'SHOPEEPAY', name: 'ShopeePay', type: 'ewallet', fee: 2000 },
      ];
    }
    
    // Format untuk frontend
    const formattedManualMethods = manualMethods.map(method => ({
      code: `MANUAL_${method._id}`,
      name: method.name,
      type: method.type,
      fee: 0,
      isManual: true,
      manualData: {
        id: method._id,
        name: method.name,
        type: method.type,
        accountNumber: method.accountNumber,
        accountName: method.accountName,
        instructions: method.instructions,
        qrImageUrl: method.qrImageUrl,
        isActive: method.isActive
      }
    }));
    
    // Gabungkan metode pembayaran
    const allMethods = [...tripayMethods, ...formattedManualMethods];
    
    res.json(allMethods);
  } catch (err) {
    console.error('Error fetching payment methods:', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;