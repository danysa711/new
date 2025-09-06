// express/controllers/subscriptionController.js (Perubahan dan Penambahan)
const { Subscription, SubscriptionPlan, User, PaymentSettings, db } = require("../models");
const whatsappService = require("../services/whatsappService");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");

// Tambahkan di bawah fungsi yang sudah ada
// ...

// Mendapatkan riwayat langganan pengguna tertentu
const getUserSubscriptionHistory = async (req, res) => {
  try {
    // Hanya admin yang boleh melihat riwayat ini
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }
    
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: "ID pengguna harus disertakan" });
    }
    
    // Dapatkan semua langganan milik pengguna ini
    const subscriptions = await Subscription.findAll({
      where: { user_id: userId },
      include: [
        { 
          model: SubscriptionPlan, 
          attributes: ['id', 'name', 'duration_days', 'price', 'description'] 
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    return res.status(200).json(subscriptions);
  } catch (error) {
    console.error("Error getting user subscription history:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

const getUserSubscriptions = async (req, res) => {
  try {
    const userId = req.userId;

    // Ambil semua langganan milik pengguna
    const subscriptions = await Subscription.findAll({
      where: { user_id: userId },
      include: [
        { model: User, attributes: ['username', 'email'] }, 
        { model: SubscriptionPlan, attributes: ['name', 'duration_days', 'price'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json(subscriptions);
  } catch (error) {
    console.error("Error getting user subscriptions:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

// Fungsi baru untuk membuat langganan dari pengguna
const createUserSubscription = async (req, res) => {
  try {
    // Ambil data dari request
    const { plan_id, payment_method, phone_number } = req.body;
    const userId = req.userId;
    
    // Validasi input
    if (!plan_id || !payment_method || !phone_number) {
      return res.status(400).json({ error: "ID paket, metode pembayaran, dan nomor telepon harus diisi" });
    }
    
    // Validasi format nomor telepon
    if (!/^\d{10,15}$/.test(phone_number.replace(/[^0-9]/g, ''))) {
      return res.status(400).json({ error: "Format nomor telepon tidak valid" });
    }
    
    // Cek apakah plan tersedia
    const plan = await SubscriptionPlan.findByPk(plan_id);
    if (!plan) {
      return res.status(404).json({ error: "Paket langganan tidak ditemukan" });
    }
    
    // Cek apakah user ada
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }
    
    // Ambil pengaturan pembayaran
    const paymentSettings = await PaymentSettings.findOne({ order: [['id', 'DESC']] });
    const expiryHours = paymentSettings?.payment_expiry_hours || 24;
    const maxPendingOrders = paymentSettings?.max_pending_orders || 3;
    
    // Cek jumlah pesanan pending saat ini
    const pendingOrders = await Subscription.findAll({
      where: {
        user_id: userId,
        status: 'pending',
        payment_status: 'pending'
      }
    });
    
    if (pendingOrders.length >= maxPendingOrders) {
      return res.status(400).json({ 
        error: "Anda memiliki terlalu banyak pesanan yang menunggu verifikasi. Silakan selesaikan pembayaran atau batalkan pesanan yang ada." 
      });
    }
    
    // Cek apakah user sudah memiliki langganan aktif
    const activeSubscription = await Subscription.findOne({
      where: {
        user_id: userId,
        status: "active",
        end_date: {
          [db.Sequelize.Op.gt]: new Date()
        }
      }
    });
    
    // Hitung tanggal berakhir
    const start_date = new Date();
    const end_date = activeSubscription 
      ? new Date(activeSubscription.end_date)
      : new Date();
      
    if (activeSubscription) {
      // Jika sudah ada, tambahkan durasi
      end_date.setDate(end_date.getDate() + plan.duration_days);
    } else {
      // Jika belum ada, buat baru
      end_date.setDate(start_date.getDate() + plan.duration_days);
    }
    
    // Buat ID merchant untuk referensi
    const merchantRef = `SUB-${userId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Buat expired_at berdasarkan batas waktu pembayaran
    const expired_at = new Date();
    expired_at.setHours(expired_at.getHours() + expiryHours);
    
    // Simpan data langganan
    const newSubscription = await Subscription.create({
      user_id: userId,
      start_date,
      end_date,
      status: "pending", // Status awal pending
      payment_status: "pending",
      payment_method,
      tripay_merchant_ref: merchantRef,
      expired_at // Tambahkan expired_at
    });
    
    // Update user info - simpan nomor telepon
    await user.update({
      phone: phone_number
    });
    
    // Jika WhatsApp diaktifkan, kirim notifikasi ke admin
    if (paymentSettings?.whatsapp_enabled) {
      await whatsappService.sendVerificationRequest(newSubscription, user, plan);
    }
    
    // Siapkan data untuk respons
    const responseData = {
      success: true,
      subscription: {
        id: newSubscription.id,
        reference: merchantRef,
        plan_name: plan.name,
        duration_days: plan.duration_days,
        amount: parseFloat(plan.price),
        payment_method,
        status: newSubscription.status,
        payment_status: newSubscription.payment_status,
        start_date: newSubscription.start_date,
        end_date: newSubscription.end_date,
        expired_at: newSubscription.expired_at
      },
      payment_info: {
        qris_image_url: paymentSettings?.qris_image_url || null,
        account_number: paymentSettings?.account_number || null,
        account_name: paymentSettings?.account_name || null,
        bank_name: paymentSettings?.bank_name || null,
        expires_in_hours: expiryHours
      }
    };
    
    return res.status(201).json(responseData);
    
  } catch (error) {
    console.error("Error creating user subscription:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

// Fungsi untuk memeriksa dan mengupdate langganan yang kedaluwarsa
const checkExpiredSubscriptions = async () => {
  try {
    console.log("Memeriksa langganan yang kedaluwarsa...");
    const now = new Date();
    
    // Cari langganan yang status pembayarannya pending dan sudah melewati batas waktu
    const expiredSubscriptions = await Subscription.findAll({
      where: {
        status: 'pending',
        payment_status: 'pending',
        expired_at: {
          [db.Sequelize.Op.lt]: now
        }
      },
      include: [
        { model: User, attributes: ['id', 'username', 'email', 'phone'] },
        { model: SubscriptionPlan, attributes: ['name', 'duration_days', 'price'] }
      ]
    });
    
    console.log(`Ditemukan ${expiredSubscriptions.length} langganan yang kedaluwarsa`);
    
    // Update status menjadi canceled
    for (const subscription of expiredSubscriptions) {
      await subscription.update({
        status: 'canceled',
        payment_status: 'failed'
      });
      
      console.log(`Langganan ${subscription.id} dibatalkan otomatis karena kedaluwarsa`);
      
      // Kirim notifikasi jika WhatsApp aktif
      const paymentSettings = await PaymentSettings.findOne({ order: [['id', 'DESC']] });
      
      if (paymentSettings?.whatsapp_enabled && subscription.User?.phone) {
        let message = paymentSettings.rejected_message_template;
        message = message.replace(/{username}/g, subscription.User.username);
        message = message.replace(/{email}/g, subscription.User.email);
        message = message.replace(/{plan_name}/g, subscription.SubscriptionPlan?.name || 'Langganan');
        
        await whatsappService.sendMessageToUser(subscription.User.phone, message);
      }
    }
    
    return {
      success: true,
      processed: expiredSubscriptions.length
    };
  } catch (error) {
    console.error("Error checking expired subscriptions:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Fungsi untuk mendapatkan pengaturan pembayaran
const getPaymentSettings = async (req, res) => {
  try {
    const settings = await PaymentSettings.findOne({ order: [['id', 'DESC']] });
    
    // Jika tidak ditemukan, buat pengaturan default
    if (!settings) {
      const defaultSettings = await PaymentSettings.create({});
      return res.status(200).json(defaultSettings);
    }
    
    return res.status(200).json(settings);
  } catch (error) {
    console.error("Error getting payment settings:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

// Fungsi untuk mengupdate pengaturan pembayaran
const updatePaymentSettings = async (req, res) => {
  try {
    // Hanya admin yang boleh mengupdate
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }
    
    const { 
      payment_expiry_hours,
      qris_image_url,
      account_number,
      account_name,
      bank_name,
      verification_message_template,
      success_message_template,
      rejected_message_template,
      whatsapp_enabled,
      max_pending_orders
    } = req.body;
    
    // Validasi beberapa input
    if (payment_expiry_hours && (isNaN(payment_expiry_hours) || payment_expiry_hours < 1)) {
      return res.status(400).json({ error: "Batas waktu pembayaran harus berupa angka positif" });
    }
    
    if (max_pending_orders && (isNaN(max_pending_orders) || max_pending_orders < 1)) {
      return res.status(400).json({ error: "Maksimal pesanan tertunda harus berupa angka positif" });
    }
    
    let settings = await PaymentSettings.findOne({ order: [['id', 'DESC']] });
    
    // Jika tidak ada, buat baru
    if (!settings) {
      settings = await PaymentSettings.create({});
    }
    
    // Update pengaturan
    await settings.update({
      payment_expiry_hours: payment_expiry_hours || settings.payment_expiry_hours,
      qris_image_url: qris_image_url || settings.qris_image_url,
      account_number: account_number !== undefined ? account_number : settings.account_number,
      account_name: account_name !== undefined ? account_name : settings.account_name,
      bank_name: bank_name !== undefined ? bank_name : settings.bank_name,
      verification_message_template: verification_message_template || settings.verification_message_template,
      success_message_template: success_message_template || settings.success_message_template,
      rejected_message_template: rejected_message_template || settings.rejected_message_template,
      whatsapp_enabled: whatsapp_enabled !== undefined ? whatsapp_enabled : settings.whatsapp_enabled,
      max_pending_orders: max_pending_orders || settings.max_pending_orders
    });
    
    return res.status(200).json({
      message: "Pengaturan pembayaran berhasil diperbarui",
      settings
    });
  } catch (error) {
    console.error("Error updating payment settings:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

// Fungsi untuk memverifikasi pembayaran langganan
const verifySubscriptionPayment = async (req, res) => {
  try {
    // Hanya admin yang boleh memverifikasi
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }
    
    const { subscription_id, action } = req.body;
    
    // Validasi input
    if (!subscription_id || !action) {
      return res.status(400).json({ error: "ID langganan dan action harus diisi" });
    }
    
    if (action !== 'approve' && action !== 'reject') {
      return res.status(400).json({ error: "Action harus berupa 'approve' atau 'reject'" });
    }
    
    // Ambil data langganan
    const subscription = await Subscription.findOne({ 
      where: { id: subscription_id },
      include: [
        { model: User, attributes: ['id', 'username', 'email', 'phone'] },
        { model: SubscriptionPlan, attributes: ['id', 'name', 'duration_days', 'price'] }
      ]
    });
    
    if (!subscription) {
      return res.status(404).json({ error: "Langganan tidak ditemukan" });
    }
    
    // Cek apakah langganan masih pending
    if (subscription.status !== 'pending' || subscription.payment_status !== 'pending') {
      return res.status(400).json({ error: "Langganan sudah diproses sebelumnya" });
    }
    
    // Ambil pengaturan untuk template pesan
    const paymentSettings = await PaymentSettings.findOne({ order: [['id', 'DESC']] });
    const whatsappEnabled = paymentSettings?.whatsapp_enabled || false;
    
    // Proses verifikasi atau penolakan
    if (action === 'approve') {
      // Update status langganan menjadi aktif
      await subscription.update({
        status: 'active',
        payment_status: 'paid'
      });
      
      // Kirim notifikasi ke pengguna
      if (whatsappEnabled && subscription.User.phone) {
        let message = paymentSettings.success_message_template || '';
        message = message.replace(/{username}/g, subscription.User.username);
        message = message.replace(/{plan_name}/g, subscription.SubscriptionPlan.name);
        message = message.replace(/{duration}/g, subscription.SubscriptionPlan.duration_days);
        message = message.replace(/{end_date}/g, moment(subscription.end_date).format('DD MMMM YYYY'));
        
        await whatsappService.sendMessageToUser(subscription.User.phone, message);
      }
      
      return res.status(200).json({ 
        message: "Pembayaran berhasil diverifikasi", 
        subscription
      });
    } else {
      // Update status langganan menjadi dibatalkan
      await subscription.update({
        status: 'canceled',
        payment_status: 'failed'
      });
      
      // Kirim notifikasi ke pengguna
      if (whatsappEnabled && subscription.User.phone) {
        let message = paymentSettings.rejected_message_template || '';
        message = message.replace(/{username}/g, subscription.User.username);
        message = message.replace(/{plan_name}/g, subscription.SubscriptionPlan.name);
        
        await whatsappService.sendMessageToUser(subscription.User.phone, message);
      }
      
      return res.status(200).json({ 
        message: "Pembayaran ditolak", 
        subscription
      });
    }
  } catch (error) {
    console.error("Error verifying subscription payment:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

// Fungsi untuk mendapatkan langganan yang menunggu verifikasi
const getPendingSubscriptions = async (req, res) => {
  try {
    // Hanya admin yang boleh melihat daftar ini
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }
    
    const pendingSubscriptions = await Subscription.findAll({
      where: {
        status: 'pending',
        payment_status: 'pending'
      },
      include: [
        { model: User, attributes: ['id', 'username', 'email', 'phone', 'url_slug'] },
        { model: SubscriptionPlan, attributes: ['id', 'name', 'duration_days', 'price'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    return res.status(200).json(pendingSubscriptions);
  } catch (error) {
    console.error("Error getting pending subscriptions:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

// Fungsi untuk mendapatkan langganan menunggu verifikasi pengguna tertentu
const getUserPendingSubscriptions = async (req, res) => {
  try {
    const userId = req.userId;
    
    const pendingSubscriptions = await Subscription.findAll({
      where: {
        user_id: userId,
        status: 'pending',
        payment_status: 'pending'
      },
      include: [
        { model: SubscriptionPlan, attributes: ['id', 'name', 'duration_days', 'price'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 3 // Hanya ambil 3 pesanan terakhir
    });
    
    // Tambahkan informasi pembayaran
    const paymentSettings = await PaymentSettings.findOne({ order: [['id', 'DESC']] });
    
    // Siapkan data untuk respons
    const pendingSubscriptionsWithPaymentInfo = pendingSubscriptions.map(sub => {
      const plainSub = sub.get({ plain: true });
      return {
        ...plainSub,
        payment_info: {
          qris_image_url: paymentSettings?.qris_image_url || null,
          account_number: paymentSettings?.account_number || null,
          account_name: paymentSettings?.account_name || null,
          bank_name: paymentSettings?.bank_name || null
        }
      };
    });
    
    return res.status(200).json(pendingSubscriptionsWithPaymentInfo);
  } catch (error) {
    console.error("Error getting user pending subscriptions:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

// Fungsi untuk membatalkan pesanan langganan
const cancelSubscriptionOrder = async (req, res) => {
  try {
    const { subscription_id } = req.params;
    const userId = req.userId;
    
    // Cari langganan
    const subscription = await Subscription.findOne({
      where: {
        id: subscription_id,
        user_id: userId,
        status: 'pending',
        payment_status: 'pending'
      }
    });
    
    if (!subscription) {
      return res.status(404).json({ error: "Pesanan tidak ditemukan atau sudah diproses" });
    }
    
    // Update status
    await subscription.update({
      status: 'canceled',
      payment_status: 'failed'
    });
    
    return res.status(200).json({
      message: "Pesanan berhasil dibatalkan",
      subscription
    });
  } catch (error) {
    console.error("Error canceling subscription order:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

// Jadikan fungsi-fungsi baru ini tersedia untuk router
module.exports = {
  getAllSubscriptionPlans,
  getSubscriptionPlanById,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  getUserSubscriptions,
  getAllSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscriptionStatus,
  cancelSubscription,
  extendSubscription,
  createUserSubscription,
  getPaymentSettings,
  updatePaymentSettings,
  verifySubscriptionPayment,
  getPendingSubscriptions,
  getUserPendingSubscriptions,
  cancelSubscriptionOrder,
  checkExpiredSubscriptions,
  getUserSubscriptionHistory
};