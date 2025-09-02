// express/controllers/tripayController.js
const crypto = require('crypto');
const axios = require('axios');
const { Subscription, User, SubscriptionPlan, Setting, Transaction, db } = require('../models');

// Konfigurasi Tripay
const TRIPAY_API_KEY = process.env.TRIPAY_API_KEY || 'your-api-key';
const TRIPAY_PRIVATE_KEY = process.env.TRIPAY_PRIVATE_KEY || 'your-private-key';
const TRIPAY_MERCHANT_CODE = process.env.TRIPAY_MERCHANT_CODE || 'your-merchant-code';
const TRIPAY_URL = process.env.TRIPAY_URL || 'https://tripay.co.id/api';
const TRIPAY_SANDBOX_MODE = process.env.TRIPAY_SANDBOX_MODE === 'true' || false;

// Fungsi untuk mendapatkan konfigurasi Tripay
const getTripayConfig = async (req, res) => {
  try {
    // Cek status Tripay
    const tripayEnabled = await Setting.findOne({ where: { key: 'tripay_enabled' } });
    
    // Jika Tripay tidak aktif, return hanya status
    if (!tripayEnabled || tripayEnabled.value !== 'true') {
      return res.json({
        enabled: false
      });
    }
    
    // Kirim konfigurasi (sembunyikan private key)
    res.json({
      enabled: true,
      api_key: TRIPAY_API_KEY,
      private_key: '********',
      merchant_code: TRIPAY_MERCHANT_CODE,
      sandbox_mode: TRIPAY_SANDBOX_MODE
    });
  } catch (error) {
    console.error('Error getting Tripay config:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

// Fungsi untuk menyimpan konfigurasi Tripay
const saveTripayConfig = async (req, res) => {
  try {
    const { 
      enabled, 
      api_key, 
      private_key, 
      merchant_code, 
      sandbox_mode 
    } = req.body;
    
    // Update status Tripay di tabel Setting
    let tripayEnabled = await Setting.findOne({ where: { key: 'tripay_enabled' } });
    
    if (!tripayEnabled) {
      // Buat setting baru jika belum ada
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
    
    // Jika Tripay diaktifkan, simpan konfigurasi ke environment
    if (enabled) {
      // Dalam produksi, simpan ke env vars atau database yang aman
      process.env.TRIPAY_API_KEY = api_key;
      process.env.TRIPAY_MERCHANT_CODE = merchant_code;
      process.env.TRIPAY_SANDBOX_MODE = sandbox_mode.toString();
      
      // Hanya perbarui private key jika diisi dan bukan placeholder
      if (private_key && private_key !== '********') {
        process.env.TRIPAY_PRIVATE_KEY = private_key;
      }
    }
    
    res.json({ 
      success: true, 
      message: `Konfigurasi Tripay berhasil ${enabled ? 'diaktifkan' : 'dinonaktifkan'}`,
      enabled
    });
  } catch (error) {
    console.error('Error saving Tripay config:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

// Fungsi untuk menguji koneksi Tripay
const testTripayConnection = async (req, res) => {
  try {
    const { api_key, merchant_code, sandbox_mode } = req.body;
    
    // Validasi input
    if (!api_key || !merchant_code) {
      return res.status(400).json({ 
        success: false, 
        message: 'API key dan Merchant Code diperlukan' 
      });
    }
    
    // Set URL berdasarkan mode
    const baseUrl = sandbox_mode ? 
      'https://tripay.co.id/api-sandbox' : 
      'https://tripay.co.id/api';
    
    // Lakukan request ke Tripay untuk mengecek koneksi
    const response = await axios.get(`${baseUrl}/merchant/payment-channel`, {
      headers: {
        'Authorization': `Bearer ${api_key}`
      }
    });
    
    if (response.data && response.data.success) {
      // Koneksi berhasil
      return res.json({
        success: true,
        message: 'Koneksi ke Tripay berhasil',
        merchantName: response.data.data && response.data.data.length > 0 ? 
          'Merchant terverifikasi' : 'Merchant Anda',
        environment: sandbox_mode ? 'Sandbox' : 'Production'
      });
    } else {
      // Koneksi gagal
      return res.json({
        success: false,
        message: 'Koneksi ke Tripay gagal',
        error: response.data.message || 'Silakan periksa konfigurasi Anda'
      });
    }
  } catch (error) {
    console.error('Error testing Tripay connection:', error);
    return res.status(500).json({
      success: false,
      message: 'Koneksi ke Tripay gagal',
      error: error.response?.data?.message || error.message
    });
  }
};

// Get payment channels dari Tripay
const getPaymentChannels = async (req, res) => {
  try {
    // Cek status Tripay
    const tripayEnabled = await Setting.findOne({ where: { key: 'tripay_enabled' } });
    if (!tripayEnabled || tripayEnabled.value !== 'true') {
      return res.status(400).json({ message: 'Tripay tidak aktif' });
    }
    
    // Get current config
    const apiKey = TRIPAY_API_KEY;
    const baseUrl = TRIPAY_SANDBOX_MODE ? 
      'https://tripay.co.id/api-sandbox' : 
      'https://tripay.co.id/api';
      
    const response = await axios.get(`${baseUrl}/merchant/payment-channel`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    return res.status(200).json(response.data.data);
  } catch (error) {
    console.error('Error fetching payment channels:', error);
    return res.status(500).json({ error: 'Gagal mengambil metode pembayaran' });
  }
};

// Kalkulasi biaya transaksi
const calculateFee = async (req, res) => {
  try {
    const { amount, code } = req.body;

    if (!amount || !code) {
      return res.status(400).json({ error: 'Parameter tidak lengkap' });
    }
    
    // Cek status Tripay
    const tripayEnabled = await Setting.findOne({ where: { key: 'tripay_enabled' } });
    if (!tripayEnabled || tripayEnabled.value !== 'true') {
      return res.status(400).json({ message: 'Tripay tidak aktif' });
    }
    
    // Get current config
    const apiKey = TRIPAY_API_KEY;
    const baseUrl = TRIPAY_SANDBOX_MODE ? 
      'https://tripay.co.id/api-sandbox' : 
      'https://tripay.co.id/api';

    const response = await axios.get(`${baseUrl}/merchant/fee-calculator`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      params: {
        amount,
        code
      }
    });

    return res.status(200).json(response.data.data);
  } catch (error) {
    console.error('Error calculating fee:', error);
    return res.status(500).json({ error: 'Gagal menghitung biaya transaksi' });
  }
};

// Membuat transaksi baru
const createTransaction = async (req, res) => {
  try {
    const {
      plan_id,
      payment_method,
      customer_name,
      customer_email,
      customer_phone
    } = req.body;

    const userId = req.userId;

    // Validasi input
    if (!plan_id || !payment_method) {
      return res.status(400).json({ error: 'Parameter tidak lengkap' });
    }
    
    // Cek status Tripay
    const tripayEnabled = await Setting.findOne({ where: { key: 'tripay_enabled' } });
    if (!tripayEnabled || tripayEnabled.value !== 'true') {
      return res.status(400).json({ message: 'Tripay tidak aktif' });
    }

    // Dapatkan user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    // Dapatkan paket langganan
    const plan = await SubscriptionPlan.findByPk(plan_id);
    if (!plan) {
      return res.status(404).json({ error: 'Paket langganan tidak ditemukan' });
    }
    
    // Get current config
    const apiKey = TRIPAY_API_KEY;
    const privateKey = TRIPAY_PRIVATE_KEY;
    const merchantCode = TRIPAY_MERCHANT_CODE;
    const baseUrl = TRIPAY_SANDBOX_MODE ? 
      'https://tripay.co.id/api-sandbox' : 
      'https://tripay.co.id/api';

    // Generate signature
    const merchantRef = `SUB-${userId}-${Date.now()}`;
    const amount = plan.price;
    const signature = crypto
      .createHmac('sha256', privateKey)
      .update(`${merchantCode}${merchantRef}${amount}`)
      .digest('hex');

    // Data untuk request ke Tripay
    const data = {
      method: payment_method,
      merchant_ref: merchantRef,
      amount: amount,
      customer_name: customer_name || user.username,
      customer_email: customer_email || user.email || 'customer@example.com',
      customer_phone: customer_phone || '08123456789',
      order_items: [
        {
          name: `${plan.name} Subscription`,
          price: amount,
          quantity: 1,
          subtotal: amount
        }
      ],
      callback_url: `${req.protocol}://${req.get('host')}/api/tripay/callback`,
      return_url: `${req.protocol}://${req.get('host')}/user/page/${user.url_slug}/subscription`,
      signature: signature
    };

    // Request ke Tripay untuk membuat transaksi
    const response = await axios.post(`${baseUrl}/transaction/create`, data, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    // Simpan data transaksi di database
    const dbTransaction = await db.sequelize.transaction();
    
    try {
      // Cek apakah user sudah memiliki langganan aktif
      const activeSubscription = await Subscription.findOne({
        where: {
          user_id: userId,
          status: 'active',
          end_date: {
            [db.Sequelize.Op.gt]: new Date()
          }
        },
        transaction: dbTransaction
      });

      let subscriptionId;
      const startDate = new Date();
      let endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.duration_days);

      if (activeSubscription) {
        // Jika sudah ada langganan aktif, perpanjang dari tanggal berakhir langganan saat ini
        endDate = new Date(activeSubscription.end_date);
        endDate.setDate(endDate.getDate() + plan.duration_days);
        
        await activeSubscription.update({
          end_date: endDate,
          payment_status: 'pending',
          payment_method: 'tripay',
          updatedAt: new Date(),
          tripay_reference: response.data.data.reference,
          tripay_merchant_ref: merchantRef
        }, { transaction: dbTransaction });
        
        subscriptionId = activeSubscription.id;
      } else {
        // Jika belum ada langganan aktif, buat langganan baru
        const newSubscription = await Subscription.create({
          user_id: userId,
          start_date: startDate,
          end_date: endDate,
          status: 'active',
          payment_status: 'pending',
          payment_method: 'tripay',
          tripay_reference: response.data.data.reference,
          tripay_merchant_ref: merchantRef
        }, { transaction: dbTransaction });
        
        subscriptionId = newSubscription.id;
      }
      
      // Buat entri di tabel Transaction
      await Transaction.create({
        reference: response.data.data.reference,
        merchant_ref: merchantRef,
        user_id: userId,
        subscription_id: subscriptionId,
        payment_method: payment_method,
        payment_name: response.data.data.payment_name,
        payment_type: 'tripay',
        amount: response.data.data.amount,
        fee: response.data.data.fee,
        total_amount: response.data.data.amount + response.data.data.fee,
        status: 'UNPAID',
        payment_code: response.data.data.pay_code || null,
        qr_url: response.data.data.qr_url || null,
        instructions: JSON.stringify(response.data.data.instructions),
        customer_name: customer_name || user.username,
        customer_email: customer_email || user.email || 'customer@example.com',
        customer_phone: customer_phone || '08123456789',
        plan_id: plan_id,
        plan_name: plan.name,
        expired_at: response.data.data.expired_time
      }, { transaction: dbTransaction });
      
      await dbTransaction.commit();
      
      // Return response ke client
      return res.status(200).json({
        success: true,
        message: 'Transaksi berhasil dibuat',
        data: response.data.data
      });
    } catch (error) {
      await dbTransaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error creating transaction:', error);
    return res.status(500).json({ error: 'Gagal membuat transaksi' });
  }
};

// Detail transaksi
const getTransactionDetail = async (req, res) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({ error: 'Parameter tidak lengkap' });
    }
    
    // Cek status Tripay
    const tripayEnabled = await Setting.findOne({ where: { key: 'tripay_enabled' } });
    if (!tripayEnabled || tripayEnabled.value !== 'true') {
      return res.status(400).json({ message: 'Tripay tidak aktif' });
    }
    
    // Get current config
    const apiKey = TRIPAY_API_KEY;
    const baseUrl = TRIPAY_SANDBOX_MODE ? 
      'https://tripay.co.id/api-sandbox' : 
      'https://tripay.co.id/api';

    const response = await axios.get(`${baseUrl}/transaction/detail`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      params: {
        reference
      }
    });

    return res.status(200).json(response.data.data);
  } catch (error) {
    console.error('Error getting transaction detail:', error);
    return res.status(500).json({ error: 'Gagal mendapatkan detail transaksi' });
  }
};

// Cek status transaksi Tripay
const checkTransactionStatus = async (req, res) => {
  try {
    const { reference } = req.params;
    
    // Validasi input
    if (!reference) {
      return res.status(400).json({ 
        success: false, 
        message: 'Referensi transaksi diperlukan' 
      });
    }
    
    // Cek status Tripay
    const tripayEnabled = await Setting.findOne({ where: { key: 'tripay_enabled' } });
    if (!tripayEnabled || tripayEnabled.value !== 'true') {
      return res.status(400).json({ message: 'Tripay tidak aktif' });
    }
    
    // Get current config
    const apiKey = TRIPAY_API_KEY;
    const baseUrl = TRIPAY_SANDBOX_MODE ? 
      'https://tripay.co.id/api-sandbox' : 
      'https://tripay.co.id/api';
    
    // Lakukan request ke Tripay
    const response = await axios.get(`${baseUrl}/transaction/detail`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      params: { reference }
    });
    
    if (response.data && response.data.success) {
      const tripayStatus = response.data.data.status;
      
      // Jika status di Tripay berbeda dengan status di database, update status
      const transaction = await Transaction.findOne({ where: { reference } });
      
      if (transaction) {
        let newStatus = transaction.status;
        
        // Konversi status Tripay ke format database
        if (tripayStatus === 'PAID') newStatus = 'PAID';
        else if (tripayStatus === 'EXPIRED') newStatus = 'EXPIRED';
        else if (tripayStatus === 'FAILED') newStatus = 'FAILED';
        
        // Update status transaksi jika berbeda
        if (newStatus !== transaction.status) {
          await transaction.update({
            status: newStatus,
            paid_at: newStatus === 'PAID' ? new Date() : transaction.paid_at
          });
          
          // Jika status PAID, update langganan
          if (newStatus === 'PAID') {
            const { updateSubscriptionAfterPayment } = require('./paymentController');
            
            // Ekstrak user_id dan subscription_id dari merchant_ref
            const parts = transaction.merchant_ref.split('-');
            if (parts.length >= 3 && parts[0] === 'SUB') {
              const userId = parts[1];
              // PERBAIKAN: Jika subscriptionId tidak ada, gunakan userId saja
              // Ini untuk kasus SUB-userId-timestamp
              let subscriptionId;
              
              if (isNaN(parseInt(parts[2]))) {
                // parts[2] bukan angka, kemungkinan timestamp
                subscriptionId = null;
              } else {
                subscriptionId = parts[2];
              }
              
              // Ambil paket langganan
              let durationDays = 30; // Default
              
              if (transaction.plan_id) {
                const plan = await SubscriptionPlan.findByPk(transaction.plan_id);
                if (plan) {
                  durationDays = plan.duration_days;
                }
              }
              
              // Update langganan
              await updateSubscriptionAfterPayment(userId, subscriptionId, durationDays);
            }
          }
          
          return res.json({
            success: true,
            message: `Status transaksi berhasil diperbarui menjadi ${newStatus}`,
            newStatus
          });
        } else {
          return res.json({
            success: true,
            message: 'Status transaksi tidak berubah',
            status: newStatus
          });
        }
      } else {
        return res.status(404).json({
          success: false,
          message: 'Transaksi tidak ditemukan di database'
        });
      }
    } else {
      return res.json({
        success: false,
        message: 'Gagal mendapatkan status transaksi dari Tripay',
        error: response.data.message
      });
    }
  } catch (error) {
    console.error('Error checking transaction status:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memeriksa status transaksi',
      error: error.response?.data?.message || error.message
    });
  }
};

// Callback dari Tripay
const handleCallback = async (req, res) => {
  try {
    // Get current config
    const privateKey = TRIPAY_PRIVATE_KEY;
    
    // Validasi signature dari Tripay
    const callbackSignature = req.headers['x-callback-signature'];
    const json = req.body;
    
    const signature = crypto
      .createHmac('sha256', privateKey)
      .update(JSON.stringify(json))
      .digest('hex');
    
    if (callbackSignature !== signature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }
    
    // Process data pembayaran
    const data = json;
    const reference = data.reference;
    const merchantRef = data.merchant_ref;
    const status = data.status;
    
    // Update status pembayaran di database
    const dbTransaction = await db.sequelize.transaction();
    
    try {
      // Cari transaksi berdasarkan reference
      const transaction = await Transaction.findOne({
        where: { reference }
      });
      
      if (!transaction) {
        await dbTransaction.rollback();
        return res.status(404).json({ error: 'Transaction not found' });
      }
      
      // Update status transaksi
      let newStatus = transaction.status;
      
      if (status === 'PAID') newStatus = 'PAID';
      else if (status === 'EXPIRED') newStatus = 'EXPIRED';
      else if (status === 'FAILED') newStatus = 'FAILED';
      
      // Update transaksi
      await transaction.update({
        status: newStatus,
        paid_at: newStatus === 'PAID' ? new Date() : transaction.paid_at
      }, { transaction: dbTransaction });
      
      // Jika status PAID, update langganan
      if (newStatus === 'PAID') {
        const { updateSubscriptionAfterPayment } = require('./paymentController');
        
        // Ekstrak user_id dan subscription_id dari merchant_ref
        const parts = transaction.merchant_ref.split('-');
        let userId, subscriptionId;
        
        if (parts.length >= 3 && parts[0] === 'SUB') {
          userId = parts[1];
          // PERBAIKAN: Jika subscriptionId tidak ada, gunakan userId saja
          // Ini untuk kasus SUB-userId-timestamp
          if (isNaN(parseInt(parts[2]))) {
            // parts[2] bukan angka, kemungkinan timestamp
            subscriptionId = null;
          } else {
            subscriptionId = parts[2];
          }
        }
        
        // Ambil paket langganan
        let durationDays = 30; // Default
        
        if (transaction.plan_id) {
          const plan = await SubscriptionPlan.findByPk(transaction.plan_id);
          if (plan) {
            durationDays = plan.duration_days;
          }
        }
        
        // Update langganan
        await updateSubscriptionAfterPayment(userId, subscriptionId, durationDays);
      }
      
      await dbTransaction.commit();
      
      return res.status(200).json({ success: true });
    } catch (error) {
      await dbTransaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error handling callback:', error);
    return res.status(500).json({ error: 'Error processing callback' });
  }
};

module.exports = {
  getTripayConfig,
  saveTripayConfig,
  testTripayConnection,
  getPaymentChannels,
  calculateFee,
  createTransaction,
  getTransactionDetail,
  checkTransactionStatus,
  handleCallback
};