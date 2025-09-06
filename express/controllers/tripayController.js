const crypto = require('crypto');
const axios = require('axios');
const { Subscription, User, SubscriptionPlan, db } = require('../models');

// Konfigurasi Tripay
const TRIPAY_API_KEY = process.env.TRIPAY_API_KEY || 'your-api-key';
const TRIPAY_PRIVATE_KEY = process.env.TRIPAY_PRIVATE_KEY || 'your-private-key';
const TRIPAY_MERCHANT_CODE = process.env.TRIPAY_MERCHANT_CODE || 'your-merchant-code';
const TRIPAY_URL = process.env.TRIPAY_URL || 'https://tripay.co.id/api';

// Get payment channels dari Tripay
const getPaymentChannels = async (req, res) => {
  try {
    const response = await axios.get(`${TRIPAY_URL}/merchant/payment-channel`, {
      headers: {
        'Authorization': `Bearer ${TRIPAY_API_KEY}`
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

    const response = await axios.get(`${TRIPAY_URL}/merchant/fee-calculator`, {
      headers: {
        'Authorization': `Bearer ${TRIPAY_API_KEY}`
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

    // Generate signature
    const merchantRef = `SUB-${userId}-${Date.now()}`;
    const amount = plan.price;
    const signature = crypto
      .createHmac('sha256', TRIPAY_PRIVATE_KEY)
      .update(`${TRIPAY_MERCHANT_CODE}${merchantRef}${amount}`)
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
    const response = await axios.post(`${TRIPAY_URL}/transaction/create`, data, {
      headers: {
        'Authorization': `Bearer ${TRIPAY_API_KEY}`
      }
    });

    // Simpan data transaksi di database
    const transaction = await db.sequelize.transaction();
    
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
        transaction
      });

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
          updatedAt: new Date()
        }, { transaction });
        
        // Simpan referensi transaksi ke subscription yang ada
        await activeSubscription.update({
          tripay_reference: response.data.data.reference,
          tripay_merchant_ref: merchantRef
        }, { transaction });
        
        await transaction.commit();
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
        }, { transaction });
        
        await transaction.commit();
      }
      
      // Return response ke client
      return res.status(200).json(response.data.data);
    } catch (error) {
      await transaction.rollback();
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

    const response = await axios.get(`${TRIPAY_URL}/transaction/detail`, {
      headers: {
        'Authorization': `Bearer ${TRIPAY_API_KEY}`
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

// Callback dari Tripay
const handleCallback = async (req, res) => {
  try {
    // Validasi signature dari Tripay
    const callbackSignature = req.headers['x-callback-signature'];
    const json = req.body;
    
    const signature = crypto
      .createHmac('sha256', TRIPAY_PRIVATE_KEY)
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
    const transaction = await db.sequelize.transaction();
    
    try {
      // Cari subscription berdasarkan reference
      const subscription = await Subscription.findOne({
        where: {
          tripay_reference: reference
        },
        transaction
      });
      
      if (!subscription) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Subscription not found' });
      }
      
      // Update status subscription berdasarkan status pembayaran
      if (status === 'PAID') {
        await subscription.update({
          payment_status: 'paid',
          updatedAt: new Date()
        }, { transaction });
      } else if (status === 'EXPIRED' || status === 'FAILED') {
        await subscription.update({
          payment_status: 'failed',
          updatedAt: new Date()
        }, { transaction });
      }
      
      await transaction.commit();
      
      return res.status(200).json({ success: true });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error handling callback:', error);
    return res.status(500).json({ error: 'Error processing callback' });
  }
};

module.exports = {
  getPaymentChannels,
  calculateFee,
  createTransaction,
  getTransactionDetail,
  handleCallback
};