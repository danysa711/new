// controllers/transactionController.js
const { Transaction, User, Subscription, SubscriptionPlan, PaymentMethod, Setting } = require('../models');
const { updateSubscriptionAfterPayment } = require('./paymentController');
const crypto = require('crypto');
const axios = require('axios');

// Mendapatkan transaksi aktif untuk user
const getUserActiveTransactions = async (req, res) => {
  try {
    const userId = req.userId; // Dari middleware auth
    
    const transactions = await Transaction.findAll({
      where: {
        user_id: userId,
        status: 'UNPAID'
      },
      order: [['createdAt', 'DESC']]
    });
    
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching active transactions:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Mendapatkan riwayat transaksi untuk user
const getUserTransactionHistory = async (req, res) => {
  try {
    const userId = req.userId; // Dari middleware auth
    
    const transactions = await Transaction.findAll({
      where: {
        user_id: userId,
        status: ['PAID', 'EXPIRED', 'FAILED']
      },
      order: [['createdAt', 'DESC']]
    });
    
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get Transaction by reference
const getTransactionByReference = async (req, res) => {
  try {
    const { reference } = req.params;
    
    const transaction = await Transaction.findOne({
      where: { reference }
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
    }
    
    res.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Membuat transaksi manual
const createManualTransaction = async (req, res) => {
  try {
    const { 
      user_id, 
      subscription_id, 
      payment_method_code, 
      plan_id,
      amount,
      name,
      email,
      phone
    } = req.body;
    
    // Validasi data
    if (!user_id || !subscription_id || !payment_method_code) {
      return res.status(400).json({ message: 'Data tidak lengkap' });
    }
    
    // Ekstrak ID metode pembayaran dari kode
    const paymentMethodId = payment_method_code.replace('MANUAL_', '');
    
    // Cari metode pembayaran
    const paymentMethod = await PaymentMethod.findByPk(paymentMethodId);
    
    if (!paymentMethod) {
      return res.status(404).json({ message: 'Metode pembayaran tidak ditemukan' });
    }
    
    // Cari paket langganan
    const subscriptionPlan = plan_id ? await SubscriptionPlan.findByPk(plan_id) : null;
    
    // Buat referensi transaksi
    const reference = 'M' + Date.now() + crypto.randomBytes(3).toString('hex');
    const merchantRef = `SUB-${user_id}-${subscription_id}-${Date.now()}`;
    
    // Buat transaksi
    const transaction = await Transaction.create({
      reference,
      merchant_ref: merchantRef,
      user_id,
      subscription_id,
      payment_method: payment_method_code,
      payment_name: paymentMethod.name,
      payment_type: 'manual',
      amount: amount || (subscriptionPlan ? subscriptionPlan.price : 0),
      fee: 0,
      total_amount: amount || (subscriptionPlan ? subscriptionPlan.price : 0),
      status: 'UNPAID',
      payment_code: paymentMethod.accountNumber || null,
      account_name: paymentMethod.accountName || null,
      qr_url: paymentMethod.qrImageUrl || null,
      instructions: paymentMethod.instructions || null,
      customer_name: name,
      customer_email: email,
      customer_