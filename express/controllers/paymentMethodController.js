// controllers/paymentMethodController.js
const { PaymentMethod, Setting } = require('../models');

// Get all payment methods (Tripay + Manual)
exports.getAllPaymentMethods = async (req, res) => {
  try {
    // Cek status Tripay
    const tripayEnabled = await Setting.findOne({ where: { key: 'tripay_enabled' } });
    
    // Ambil metode pembayaran manual yang aktif
    const manualMethods = await PaymentMethod.findAll({ 
      where: { isActive: true } 
    });
    
    // Metode pembayaran Tripay
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
        { code: 'SHOPEEPAY', name: 'ShopeePay', type: 'ewallet', fee: 2000 }
      ];
    }
    
    // Format metode manual
    const formattedManualMethods = manualMethods.map(method => ({
      code: `MANUAL_${method.id}`,
      name: method.name,
      type: method.type,
      fee: 0,
      isManual: true,
      manualData: {
        id: method.id,
        name: method.name,
        type: method.type,
        accountNumber: method.accountNumber,
        accountName: method.accountName,
        instructions: method.instructions,
        qrImageUrl: method.qrImageUrl,
        isActive: method.isActive
      }
    }));
    
    // Gabungkan semua metode
    const allMethods = [...tripayMethods, ...formattedManualMethods];
    
    res.json(allMethods);
  } catch (error) {
    console.error('Error in getAllPaymentMethods:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Fallback jika model belum ada
exports.getAllPaymentMethodsFallback = async (req, res) => {
  try {
    // Data fallback
    let methods = [
      // Manual methods (default)
      {
        code: 'MANUAL_1',
        name: 'Transfer Bank BCA',
        type: 'bank',
        fee: 0,
        isManual: true,
        manualData: {
          id: 1,
          name: 'Transfer Bank BCA',
          type: 'bank',
          accountNumber: '1234567890',
          accountName: 'PT Demo Store',
          instructions: 'Transfer ke rekening BCA a/n PT Demo Store',
          isActive: true
        }
      },
      {
        code: 'MANUAL_2',
        name: 'QRIS',
        type: 'qris',
        fee: 0,
        isManual: true,
        manualData: {
          id: 2,
          name: 'QRIS',
          type: 'qris',
          qrImageUrl: 'https://example.com/qr.png',
          instructions: 'Scan kode QR menggunakan aplikasi e-wallet atau mobile banking',
          isActive: true
        }
      }
    ];
    
    // Cek apakah Tripay diaktifkan
    try {
      const tripayEnabled = await Setting.findOne({ where: { key: 'tripay_enabled' } });
      if (tripayEnabled && tripayEnabled.value === 'true') {
        // Tambahkan metode Tripay
        const tripayMethods = [
          { code: 'QRIS', name: 'QRIS', type: 'qris', fee: 800 },
          { code: 'BRIVA', name: 'Bank BRI', type: 'bank', fee: 4000 },
          { code: 'MANDIRIVA', name: 'Bank Mandiri', type: 'bank', fee: 4000 },
          { code: 'BNIVA', name: 'Bank BNI', type: 'bank', fee: 4000 },
          { code: 'BCAVA', name: 'Bank BCA', type: 'bank', fee: 4000 },
          { code: 'OVO', name: 'OVO', type: 'ewallet', fee: 2000 },
          { code: 'DANA', name: 'DANA', type: 'ewallet', fee: 2000 },
          { code: 'LINKAJA', name: 'LinkAja', type: 'ewallet', fee: 2000 },
          { code: 'SHOPEEPAY', name: 'ShopeePay', type: 'ewallet', fee: 2000 }
        ];
        methods = [...tripayMethods, ...methods];
      }
    } catch (settingError) {
      console.error('Error checking Tripay status:', settingError);
      // Anggap Tripay tidak aktif
    }
    
    res.json(methods);
  } catch (error) {
    console.error('Error in fallback payment methods:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};