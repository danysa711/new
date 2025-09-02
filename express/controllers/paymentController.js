// controllers/paymentController.js
const { PaymentMethod, Setting, Transaction, Subscription, SubscriptionPlan, User, db } = require('../models');
const crypto = require('crypto');

// Fungsi untuk memperbarui langganan setelah pembayaran berhasil
const updateSubscriptionAfterPayment = async (userId, subscriptionId, durationDays) => {
  try {
    console.log(`Updating subscription after payment: userId=${userId}, subscriptionId=${subscriptionId}, durationDays=${durationDays}`);
    
    // Cari langganan yang ada
    let subscription = null;
    if (subscriptionId) {
      subscription = await Subscription.findOne({
        where: {
          id: subscriptionId,
          user_id: userId
        }
      });
    }
    
    if (!subscription) {
      console.log(`Langganan dengan ID ${subscriptionId} tidak ditemukan, cek langganan aktif lainnya`);
      
      // Cek apakah user sudah memiliki langganan aktif lainnya
      const existingSubscription = await Subscription.findOne({
        where: {
          user_id: userId,
          status: 'active'
        }
      });
      
      if (existingSubscription) {
        // Jika ada langganan aktif, perpanjang langganan tersebut
        console.log(`Menemukan langganan aktif lain untuk user ${userId}, akan memperpanjang langganan ini`);
        
        // Hitung tanggal akhir baru
        let newEndDate;
        if (new Date(existingSubscription.end_date) > new Date()) {
          // Jika langganan masih aktif, tambahkan ke tanggal akhir saat ini
          newEndDate = new Date(existingSubscription.end_date);
          newEndDate.setDate(newEndDate.getDate() + parseInt(durationDays));
        } else {
          // Jika langganan sudah berakhir, mulai dari hari ini
          newEndDate = new Date();
          newEndDate.setDate(newEndDate.getDate() + parseInt(durationDays));
        }
        
        // Perbarui status langganan
        const updatedSubscription = await existingSubscription.update({
          status: 'active',
          payment_status: 'paid',
          end_date: newEndDate
        });
        
        console.log(`Langganan berhasil diperpanjang: ${existingSubscription.id}, tanggal akhir baru: ${newEndDate}`);
        
        return updatedSubscription;
      }
      
      // Jika tidak ada langganan sama sekali, buat langganan baru
      console.log(`Tidak ada langganan ditemukan untuk user ${userId}, membuat langganan baru`);
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + parseInt(durationDays));
      
      const newSubscription = await Subscription.create({
        user_id: userId,
        start_date: startDate,
        end_date: endDate,
        status: 'active',
        payment_status: 'paid',
        payment_method: 'tripay'
      });
      
      console.log(`Langganan baru dibuat untuk user ${userId}, ID: ${newSubscription.id}`);
      
      return newSubscription;
    }
    
    // Hitung tanggal akhir baru
    let newEndDate;
    
    // Jika langganan sudah berakhir, mulai dari hari ini
    if (new Date(subscription.end_date) < new Date()) {
      newEndDate = new Date();
      newEndDate.setDate(newEndDate.getDate() + parseInt(durationDays));
    } else {
      // Jika langganan masih aktif, tambahkan ke tanggal akhir saat ini
      newEndDate = new Date(subscription.end_date);
      newEndDate.setDate(newEndDate.getDate() + parseInt(durationDays));
    }
    
    // Perbarui status langganan
    const updatedSubscription = await subscription.update({
      status: 'active',
      payment_status: 'paid',
      end_date: newEndDate
    });
    
    console.log(`Langganan berhasil diperbarui: ${subscriptionId}, tanggal akhir baru: ${newEndDate}`);
    
    return updatedSubscription;
  } catch (error) {
    console.error('Gagal memperbarui langganan:', error);
    return null;
  }
};

// Get all payment methods (Tripay + Manual)
const getAllPaymentMethods = async (req, res) => {
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
      customer_phone: phone,
      plan_id: plan_id,
      plan_name: subscriptionPlan ? subscriptionPlan.name : null,
      expired_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 jam
    });
    
    // Kirim respons
    res.status(201).json({
      success: true,
      message: 'Transaksi berhasil dibuat',
      data: transaction
    });
    
  } catch (error) {
    console.error('Error creating manual transaction:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Update status transaksi manual
const updateManualTransactionStatus = async (req, res) => {
  try {
    const { reference } = req.params;
    const { status } = req.body;
    
    // Cari transaksi
    const transaction = await Transaction.findOne({
      where: { reference }
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
    }
    
    // Update status
    await transaction.update({
      status,
      paid_at: status === 'PAID' ? new Date() : transaction.paid_at
    });
    
    // Jika status PAID, update langganan
    if (status === 'PAID') {
      // Ekstrak user_id dan subscription_id dari merchant_ref
      const parts = transaction.merchant_ref.split('-');
      if (parts.length >= 3 && parts[0] === 'SUB') {
        const userId = parts[1];
        const subscriptionId = parts[2];
        
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
    
    res.json({
      success: true,
      message: 'Status transaksi berhasil diperbarui',
      data: transaction
    });
    
  } catch (error) {
    console.error('Error updating transaction status:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Mendapatkan transaksi aktif (belum lunas) untuk user
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

// Fallback jika model belum ada
const getAllPaymentMethodsFallback = async (req, res) => {
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

module.exports = {
  getAllPaymentMethods,
  getAllPaymentMethodsFallback,
  createManualTransaction,
  updateManualTransactionStatus,
  getUserActiveTransactions,
  getUserTransactionHistory,
  getTransactionByReference,
  updateSubscriptionAfterPayment
};