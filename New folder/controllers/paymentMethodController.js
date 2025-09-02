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

// Get all manual payment methods (admin only)
exports.getManualPaymentMethods = async (req, res) => {
  try {
    const manualMethods = await PaymentMethod.findAll();
    res.json(manualMethods);
  } catch (error) {
    console.error('Error fetching manual payment methods:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Create a new payment method
exports.createPaymentMethod = async (req, res) => {
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
  } catch (error) {
    console.error('Error creating payment method:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Update a payment method
exports.updatePaymentMethod = async (req, res) => {
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
      return res.status(404).json({ message: 'Metode pembayaran tidak ditemukan' });
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
  } catch (error) {
    console.error('Error updating payment method:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Delete a payment method
exports.deletePaymentMethod = async (req, res) => {
  try {
    const method = await PaymentMethod.findByPk(req.params.id);
    
    if (!method) {
      return res.status(404).json({ message: 'Metode pembayaran tidak ditemukan' });
    }
    
    await method.destroy();
    
    res.json({ message: 'Metode pembayaran berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Toggle Tripay status (enable/disable)
exports.toggleTripayStatus = async (req, res) => {
  try {
    const { enabled } = req.body;
    
    // Cari setting Tripay
    let tripayEnabled = await Setting.findOne({ where: { key: 'tripay_enabled' } });
    
    // Jika setting belum ada, buat baru
    if (!tripayEnabled) {
      tripayEnabled = await Setting.create({
        key: 'tripay_enabled',
        value: enabled.toString(),
        description: 'Status aktif/nonaktif integrasi Tripay'
      });
    } else {
      // Update setting yang ada
      tripayEnabled.value = enabled.toString();
      await tripayEnabled.save();
    }
    
    res.json({ 
      success: true, 
      message: `Tripay berhasil ${enabled ? 'diaktifkan' : 'dinonaktifkan'}`,
      tripay_enabled: enabled
    });
  } catch (error) {
    console.error('Error toggling Tripay status:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get Tripay status
exports.getTripayStatus = async (req, res) => {
  try {
    const tripayEnabled = await Setting.findOne({ where: { key: 'tripay_enabled' } });
    
    res.json({ 
      enabled: tripayEnabled ? tripayEnabled.value === 'true' : false
    });
  } catch (error) {
    console.error('Error getting Tripay status:', error);
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
      },
      {
        code: 'MANUAL_3',
        name: 'DANA',
        type: 'ewallet',
        fee: 0,
        isManual: true,
        manualData: {
          id: 3,
          name: 'DANA',
          type: 'ewallet',
          accountNumber: '08123456789',
          accountName: 'PT Demo Store',
          instructions: 'Transfer ke akun DANA a/n PT Demo Store',
          isActive: true
        }
      },
      {
        code: 'MANUAL_4',
        name: 'OVO',
        type: 'ewallet',
        fee: 0,
        isManual: true,
        manualData: {
          id: 4,
          name: 'OVO',
          type: 'ewallet',
          accountNumber: '08123456789',
          accountName: 'PT Demo Store',
          instructions: 'Transfer ke akun OVO a/n PT Demo Store',
          isActive: true
        }
      },
      {
        code: 'MANUAL_5',
        name: 'GoPay',
        type: 'ewallet',
        fee: 0,
        isManual: true,
        manualData: {
          id: 5,
          name: 'GoPay',
          type: 'ewallet',
          accountNumber: '08123456789',
          accountName: 'PT Demo Store',
          instructions: 'Transfer ke akun GoPay a/n PT Demo Store',
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