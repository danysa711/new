const { Subscription, SubscriptionPlan, User, Transaction, db } = require("../models");
const tripayService = require("../services/tripayService");

const getAllSubscriptionPlans = async (req, res) => {
  try {
    console.log("Get all subscription plans called, user:", {
      userId: req.userId || 'no user id',
      userRole: req.userRole || 'no user role'
    });
    
    const plans = await SubscriptionPlan.findAll({
      where: { is_active: true },
      order: [['duration_days', 'ASC']]
    });

    return res.status(200).json(plans);
  } catch (error) {
    console.error("Error getting subscription plans:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

const getSubscriptionPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await SubscriptionPlan.findByPk(id);

    if (!plan) {
      return res.status(404).json({ error: "Paket langganan tidak ditemukan" });
    }

    return res.status(200).json(plan);
  } catch (error) {
    console.error("Error getting subscription plan:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

const createSubscriptionPlan = async (req, res) => {
  try {
    // Check if the requester is admin
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }

    const { name, duration_days, price, description, is_active } = req.body;

    // Validasi input
    if (!name || !duration_days || !price) {
      return res.status(400).json({ error: "Nama, durasi, dan harga harus diisi" });
    }

    const newPlan = await SubscriptionPlan.create({
      name,
      duration_days,
      price,
      description,
      is_active: is_active !== undefined ? is_active : true
    });

    return res.status(201).json({
      message: "Paket langganan berhasil dibuat",
      plan: newPlan
    });
  } catch (error) {
    console.error("Error creating subscription plan:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

const updateSubscriptionPlan = async (req, res) => {
  try {
    // Check if the requester is admin
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }

    const { id } = req.params;
    const { name, duration_days, price, description, is_active } = req.body;

    const plan = await SubscriptionPlan.findByPk(id);
    if (!plan) {
      return res.status(404).json({ error: "Paket langganan tidak ditemukan" });
    }

    await plan.update({
      name: name || plan.name,
      duration_days: duration_days || plan.duration_days,
      price: price || plan.price,
      description: description || plan.description,
      is_active: is_active !== undefined ? is_active : plan.is_active
    });

    return res.status(200).json({
      message: "Paket langganan berhasil diperbarui",
      plan
    });
  } catch (error) {
    console.error("Error updating subscription plan:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

const deleteSubscriptionPlan = async (req, res) => {
  try {
    // Check if the requester is admin
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }

    const { id } = req.params;

    const plan = await SubscriptionPlan.findByPk(id);
    if (!plan) {
      return res.status(404).json({ error: "Paket langganan tidak ditemukan" });
    }

    await plan.destroy();

    return res.status(200).json({ message: "Paket langganan berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting subscription plan:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

// PERBAIKAN: getUserSubscriptions sesuai database schema yang benar
const getUserSubscriptions = async (req, res) => {
  try {
    const userId = req.userId;
    console.log(`[SUBSCRIPTION] Fetching subscriptions for user: ${userId}`);

    // PERBAIKAN: Query yang aman dengan error handling, sesuai dengan database schema
    try {
      const subscriptions = await Subscription.findAll({
        where: { user_id: userId },
        include: [
          { 
            model: User, 
            attributes: ['username', 'email'],
            as: 'user',
            required: false // LEFT JOIN untuk menghindari error
          },
          {
            model: Transaction,
            attributes: ['reference', 'payment_method', 'status', 'paid_at', 'amount', 'total_amount'],
            as: 'transaction',
            required: false, // LEFT JOIN karena mungkin subscription tanpa transaction
            include: [
              {
                model: SubscriptionPlan,
                attributes: ['name', 'duration_days', 'price'],
                as: 'plan',
                required: false
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      console.log(`[SUBSCRIPTION] Found ${subscriptions.length} subscriptions for user ${userId}`);
      return res.status(200).json(subscriptions);
      
    } catch (includeError) {
      console.warn(`[SUBSCRIPTION] Error with includes, trying basic query: ${includeError.message}`);
      
      // Fallback: Query sederhana tanpa include
      const subscriptions = await Subscription.findAll({
        where: { user_id: userId },
        order: [['createdAt', 'DESC']]
      });

      console.log(`[SUBSCRIPTION] Found ${subscriptions.length} subscriptions (basic query)`);
      return res.status(200).json(subscriptions);
    }
  } catch (error) {
    console.error("[SUBSCRIPTION] Error getting user subscriptions:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      sql: error.sql || 'no sql',
      original: error.original?.message || 'no original error'
    });
    
    // Return empty array untuk mencegah frontend crash
    return res.status(200).json([]);
  }
};

// PERBAIKAN: debugSubscriptions dengan nama tabel yang benar
const debugSubscriptions = async (req, res) => {
  try {
    const userId = req.userId;
    
    console.log("[DEBUG] Starting subscription debug for user:", userId);
    
    const debugResults = {};
    
    // Test 1: Cek apakah user ada
    try {
      const user = await User.findByPk(userId);
      debugResults.user_exists = !!user;
      debugResults.user_data = user ? { id: user.id, username: user.username, email: user.email } : null;
      console.log("[DEBUG] User found:", !!user);
    } catch (userError) {
      debugResults.user_error = userError.message;
      console.log("[DEBUG] User query error:", userError.message);
    }
    
    // Test 2: Cek struktur table Subscriptions (PascalCase sesuai database)
    try {
      const [results] = await db.sequelize.query("DESCRIBE Subscriptions");
      debugResults.subscriptions_table_structure = results.map(col => ({
        field: col.Field,
        type: col.Type,
        null: col.Null,
        key: col.Key
      }));
      console.log("[DEBUG] Subscriptions table columns:", results.map(col => col.Field));
    } catch (describeError) {
      debugResults.table_structure_error = describeError.message;
      console.log("[DEBUG] Table structure error:", describeError.message);
    }
    
    // Test 3: Cek apakah ada data subscriptions
    try {
      const subscriptionCount = await Subscription.count({ where: { user_id: userId } });
      debugResults.subscription_count = subscriptionCount;
      console.log("[DEBUG] Subscription count:", subscriptionCount);
    } catch (countError) {
      debugResults.count_error = countError.message;
      console.log("[DEBUG] Count error:", countError.message);
    }
    
    // Test 4: Coba query paling sederhana dengan nama tabel yang benar
    try {
      const rawSubscriptions = await db.sequelize.query(
        "SELECT * FROM Subscriptions WHERE user_id = ?", 
        { 
          replacements: [userId],
          type: db.sequelize.QueryTypes.SELECT 
        }
      );
      debugResults.raw_subscriptions_count = rawSubscriptions.length;
      debugResults.raw_subscriptions_sample = rawSubscriptions.slice(0, 2); // Sample data
      console.log("[DEBUG] Raw subscriptions:", rawSubscriptions.length);
    } catch (rawError) {
      debugResults.raw_query_error = rawError.message;
      console.log("[DEBUG] Raw query error:", rawError.message);
    }
    
    // Test 5: Cek table transactions
    try {
      const [transactionResults] = await db.sequelize.query("DESCRIBE transactions");
      debugResults.transactions_table_structure = transactionResults.map(col => ({
        field: col.Field,
        type: col.Type
      }));
      
      const transactionCount = await db.sequelize.query(
        "SELECT COUNT(*) as count FROM transactions WHERE user_id = ?",
        {
          replacements: [userId],
          type: db.sequelize.QueryTypes.SELECT
        }
      );
      debugResults.transaction_count = transactionCount[0].count;
    } catch (transactionError) {
      debugResults.transaction_error = transactionError.message;
    }
    
    // Test 6: Cek model associations
    try {
      debugResults.model_associations = {
        subscription_associations: Object.keys(Subscription.associations || {}),
        user_associations: Object.keys(User.associations || {}),
        transaction_associations: Transaction ? Object.keys(Transaction.associations || {}) : 'Transaction model not found'
      };
    } catch (associationError) {
      debugResults.association_error = associationError.message;
    }
    
    return res.json({
      debug: true,
      timestamp: new Date().toISOString(),
      user_id: userId,
      database_info: debugResults
    });
  } catch (error) {
    console.error("[DEBUG] DEBUG ERROR:", error);
    return res.status(500).json({ 
      debug: true, 
      error: error.message,
      error_name: error.name,
      stack: error.stack
    });
  }
};

const getAllSubscriptions = async (req, res) => {
  try {
    // Check if the requester is admin
    if (req.userRole !== "admin") {
      console.log("Permintaan ditolak: user bukan admin", req.userRole);
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }

    console.log("Mengambil semua langganan dengan hak admin");
    
    try {
      // Gunakan raw query terlebih dahulu untuk logging dan debugging
      const [rawSubscriptions] = await db.sequelize.query(`
        SELECT s.id, s.user_id, s.start_date, s.end_date, s.status, s.payment_status, 
               s.payment_method, s.createdAt, s.updatedAt, 
               u.id as user_id, u.username, u.email, u.url_slug
        FROM Subscriptions s
        LEFT JOIN Users u ON s.user_id = u.id
        ORDER BY s.createdAt DESC
      `);
      
      console.log(`Hasil raw query: ${rawSubscriptions.length} langganan ditemukan`);
      
      // Kemudian gunakan ORM untuk mendapatkan data lengkap
      const subscriptions = await Subscription.findAll({
        include: [
          { 
            model: User, 
            as: 'user',
            required: false,  // LEFT JOIN - tetap ambil subscription meskipun user tidak ditemukan
            attributes: ['id', 'username', 'email', 'url_slug']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      // Transformasi hasil untuk API agar konsisten
      const formattedSubscriptions = subscriptions.map(sub => {
        const subscription = sub.toJSON();
        
        // Ubah format user agar konsisten dengan endpoint sebelumnya
        // Di frontend menggunakan 'User' bukan 'user'
        if (subscription.user) {
          subscription.User = subscription.user;
          delete subscription.user;
        }
        
        return subscription;
      });

      console.log(`ORM query: ${formattedSubscriptions.length} langganan ditemukan`);
      return res.status(200).json(formattedSubscriptions);
    } catch (includeError) {
      console.warn("Error dengan include User, menggunakan query dasar:", includeError.message);
      
      // Fallback: gunakan raw query untuk mendapatkan data
      const [rawSubscriptions] = await db.sequelize.query(`
        SELECT s.*, u.id as user_id, u.username, u.email, u.url_slug 
        FROM Subscriptions s
        LEFT JOIN Users u ON s.user_id = u.id
        ORDER BY s.createdAt DESC
      `);
      
      // Format hasil query agar cocok dengan format yang diharapkan frontend
      const formattedSubscriptions = rawSubscriptions.map(sub => {
        // Jika ada data user, tambahkan sebagai objek terpisah
        if (sub.username) {
          sub.User = {
            id: sub.user_id,
            username: sub.username,
            email: sub.email,
            url_slug: sub.url_slug
          };
        }
        
        return sub;
      });
      
      return res.status(200).json(formattedSubscriptions);
    }
  } catch (error) {
    console.error("Error mendapatkan semua langganan:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

const getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    try {
      const subscription = await Subscription.findByPk(id, {
        include: [
          { 
            model: User, 
            attributes: ['id', 'username', 'email', 'url_slug'],
            as: 'user',
            required: false
          }
        ]
      });

      if (!subscription) {
        return res.status(404).json({ error: "Langganan tidak ditemukan" });
      }

      // Only allow admin or the subscription owner to access
      if (req.userRole !== "admin" && subscription.user_id !== req.userId) {
        return res.status(403).json({ error: "Tidak memiliki izin" });
      }

      return res.status(200).json(subscription);
    } catch (includeError) {
      console.warn("Error with include, using basic query");
      
      const subscription = await Subscription.findByPk(id);
      
      if (!subscription) {
        return res.status(404).json({ error: "Langganan tidak ditemukan" });
      }

      if (req.userRole !== "admin" && subscription.user_id !== req.userId) {
        return res.status(403).json({ error: "Tidak memiliki izin" });
      }

      return res.status(200).json(subscription);
    }
  } catch (error) {
    console.error("Error getting subscription:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

const createSubscription = async (req, res) => {
  try {
    // Check if the requester is admin
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }

    const { user_id, plan_id, payment_method, custom_days } = req.body;

    // Validasi input
    if ((!plan_id && !custom_days) || !user_id) {
      return res.status(400).json({ error: "User ID dan Plan ID atau Custom Days harus diisi" });
    }

    // Cek apakah user ada
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }

    let duration_days = custom_days;
    let plan = null;

    // Jika menggunakan plan_id, ambil durasi dari plan
    if (plan_id) {
      plan = await SubscriptionPlan.findByPk(plan_id);
      if (!plan) {
        return res.status(404).json({ error: "Paket langganan tidak ditemukan" });
      }
      duration_days = plan.duration_days;
    }

    // Hitung tanggal berakhir berdasarkan durasi
    const start_date = new Date();
    const end_date = new Date();
    end_date.setDate(end_date.getDate() + parseInt(duration_days));

    // Cek apakah user sudah memiliki langganan aktif
    const activeSubscription = await Subscription.findOne({
      where: {
        user_id,
        status: "active",
        end_date: {
          [db.Sequelize.Op.gt]: new Date()
        }
      }
    });

    // Jika sudah ada langganan aktif, perpanjang langganan tersebut
    if (activeSubscription) {
      const newEndDate = new Date(activeSubscription.end_date);
      newEndDate.setDate(newEndDate.getDate() + parseInt(duration_days));
      
      await activeSubscription.update({
        end_date: newEndDate,
        payment_status: "paid",
        payment_method: payment_method || "manual"
      });

      return res.status(200).json({
        message: "Langganan berhasil diperpanjang",
        subscription: activeSubscription
      });
    }

    // Buat langganan baru
    const newSubscription = await Subscription.create({
      user_id,
      start_date,
      end_date,
      status: "active",
      payment_status: "paid",
      payment_method: payment_method || "manual"
    });

    return res.status(201).json({
      message: "Langganan berhasil dibuat",
      subscription: newSubscription
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

const updateSubscriptionStatus = async (req, res) => {
  try {
    // Check if the requester is admin
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }

    const { id } = req.params;
    const { status, payment_status } = req.body;

    const subscription = await Subscription.findByPk(id);
    if (!subscription) {
      return res.status(404).json({ error: "Langganan tidak ditemukan" });
    }

    await subscription.update({
      status: status || subscription.status,
      payment_status: payment_status || subscription.payment_status
    });

    return res.status(200).json({
      message: "Status langganan berhasil diperbarui",
      subscription
    });
  } catch (error) {
    console.error("Error updating subscription status:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

const cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    
    const subscription = await Subscription.findByPk(id);
    if (!subscription) {
      return res.status(404).json({ error: "Langganan tidak ditemukan" });
    }

    // Only allow admin or the subscription owner to cancel
    if (req.userRole !== "admin" && subscription.user_id !== req.userId) {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }

    await subscription.update({ status: "canceled" });

    return res.status(200).json({
      message: "Langganan berhasil dibatalkan",
      subscription
    });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

const extendSubscription = async (req, res) => {
  try {
    // Check if the requester is admin
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }

    const { id } = req.params;
    const { days } = req.body;

    if (!days || isNaN(days) || days <= 0) {
      return res.status(400).json({ error: "Jumlah hari harus diisi dengan angka positif" });
    }

    const subscription = await Subscription.findByPk(id);
    if (!subscription) {
      return res.status(404).json({ error: "Langganan tidak ditemukan" });
    }

    // Hitung tanggal berakhir baru
    const currentEndDate = new Date(subscription.end_date);
    const newEndDate = new Date(currentEndDate);
    newEndDate.setDate(newEndDate.getDate() + parseInt(days));

    await subscription.update({
      end_date: newEndDate,
      status: "active" // Pastikan status aktif jika sebelumnya expired
    });

    return res.status(200).json({
      message: `Langganan berhasil diperpanjang ${days} hari`,
      subscription
    });
  } catch (error) {
    console.error("Error extending subscription:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

// PERBAIKAN: purchaseSubscription dengan error handling yang lebih baik
const purchaseSubscription = async (req, res) => {
  try {
    console.log("[PURCHASE] Purchase subscription called, body:", req.body);
    
    // Verifikasi autentikasi user
    if (!req.userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Anda harus login terlebih dahulu" 
      });
    }
    
    // Ambil data paket langganan dan user
    const { plan_id, payment_method, customer_name, customer_email, customer_phone } = req.body;
    
    // Validasi data minimal
    if (!plan_id || !payment_method) {
      return res.status(400).json({ 
        success: false, 
        message: "Data tidak lengkap: plan_id dan payment_method diperlukan" 
      });
    }
    
    // Ambil data plan
    const plan = await SubscriptionPlan.findByPk(plan_id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Paket langganan tidak ditemukan"
      });
    }
    
    // Ambil data user
    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan"
      });
    }
    
    console.log(`[PURCHASE] Processing purchase for user ${user.username}, plan ${plan.name}`);
    
    // Gunakan proxy untuk semua komunikasi dengan Tripay
    const TRIPAY_PROXY_URL = process.env.TRIPAY_PROXY_URL || "https://callback.kinterstore.com/api/tripay-proxy";
    const CALLBACK_URL = process.env.CALLBACK_URL || "https://callback.kinterstore.com/api/tripay/callback/autobot";
    const RETURN_URL = process.env.FRONTEND_URL || "https://kinterstore.my.id";
    
    try {
      // Import library yang diperlukan
      const axios = require('axios');
      const crypto = require('crypto');
      
      // Ambil konfigurasi dari setting atau env
      let tripayApiKey, tripayPrivateKey, tripayMerchantCode;
      
      try {
        const { Setting } = require('../models');
        
        // PERBAIKAN: Ambil berdasarkan key yang benar
        const apiKeySetting = await Setting.findOne({ where: { key: 'tripay_api_key' } });
        const privateKeySetting = await Setting.findOne({ where: { key: 'tripay_private_key' } });
        const merchantCodeSetting = await Setting.findOne({ where: { key: 'tripay_merchant_code' } });
        
        tripayApiKey = apiKeySetting?.value || process.env.TRIPAY_API_KEY;
        tripayPrivateKey = privateKeySetting?.value || process.env.TRIPAY_PRIVATE_KEY;
        tripayMerchantCode = merchantCodeSetting?.value || process.env.TRIPAY_MERCHANT_CODE;
        
        console.log(`[PURCHASE] Using Tripay config - API Key: ${tripayApiKey ? 'SET' : 'NOT SET'}, Merchant: ${tripayMerchantCode || 'NOT SET'}`);
      } catch (settingError) {
        console.error("[PURCHASE] Error getting Tripay settings from database:", settingError);
        tripayApiKey = process.env.TRIPAY_API_KEY;
        tripayPrivateKey = process.env.TRIPAY_PRIVATE_KEY;
        tripayMerchantCode = process.env.TRIPAY_MERCHANT_CODE;
      }
      
      // Validasi konfigurasi
      if (!tripayApiKey || !tripayPrivateKey || !tripayMerchantCode) {
        console.error("[PURCHASE] Missing Tripay configuration");
        return res.status(500).json({
          success: false,
          message: "Konfigurasi Tripay tidak lengkap"
        });
      }
      
      // Buat instance axios yang menggunakan proxy
      const tripayAxios = axios.create({
        baseURL: TRIPAY_PROXY_URL,
        timeout: 15000,
        headers: {
          'X-Tripay-API-Key': tripayApiKey,
          'Content-Type': 'application/json'
        }
      });
      
      // Generate merchant reference
      const merchantRef = `SUB-${req.userId}-${Date.now()}`;
      
      // PERBAIKAN: Pastikan amount adalah integer
      const amount = parseInt(plan.price);
      
      // Generate signature
      const signature = crypto
        .createHmac('sha256', tripayPrivateKey)
        .update(tripayMerchantCode + merchantRef + amount)
        .digest('hex');
      
      console.log("[PURCHASE] Requesting payment channels via proxy...");
      
      // Ambil channel pembayaran via proxy
      const channelsResponse = await tripayAxios.get('/merchant/payment-channel');
      
      console.log("[PURCHASE] Payment channels response status:", channelsResponse.status);
      
      const channels = channelsResponse.data.data;
      const selectedMethod = channels.find(m => m.code === payment_method);
      
      if (!selectedMethod) {
        return res.status(400).json({
          success: false,
          message: "Metode pembayaran tidak tersedia"
        });
      }
      
      // Buat transaksi di Tripay via proxy
      const tripayPayload = {
        method: payment_method,
        merchant_ref: merchantRef,
        amount: amount,
        customer_name: customer_name || user.username || '',
        customer_email: customer_email || user.email || '',
        customer_phone: customer_phone || '',
        order_items: [{
          name: `Langganan ${plan.name}`,
          price: amount,
          quantity: 1
        }],
        callback_url: CALLBACK_URL,
        return_url: `${RETURN_URL}/subscription`,
        expired_time: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 jam dalam format Unix timestamp
        signature: signature
      };
      
      console.log("[PURCHASE] Sending payload to Tripay via proxy");
      
      // Panggil API Tripay via proxy
      const tripayResponse = await tripayAxios.post('/transaction/create', tripayPayload);
      
      console.log("[PURCHASE] Tripay transaction response status:", tripayResponse.status);
      
      if (!tripayResponse.data.success) {
        console.error("[PURCHASE] Tripay API error:", tripayResponse.data);
        return res.status(400).json({
          success: false,
          message: tripayResponse.data.message || "Gagal membuat transaksi di Tripay"
        });
      }
      
      const tripayData = tripayResponse.data.data;
      
      // PERBAIKAN: Simpan data transaksi ke database dengan error handling
      try {
        const transaction = await Transaction.create({
          reference: tripayData.reference,
          merchant_ref: tripayData.merchant_ref,
          user_id: req.userId,
          plan_id: plan_id,
          payment_method: payment_method,
          payment_name: selectedMethod.name,
          amount: amount,
          fee: selectedMethod.fee || 0,
          total_amount: tripayData.amount,
          status: 'UNPAID',
          payment_code: tripayData.pay_code || null,
          qr_url: tripayData.qr_url || null,
          instructions: JSON.stringify(tripayData.instructions || []),
          created_at: new Date(),
          expired_at: new Date(tripayData.expired_time * 1000),
          updated_at: new Date()
        });
        
        console.log("[PURCHASE] Transaction saved to database:", transaction.id);
        
        // Kembalikan respons dengan data transaksi
        return res.json({
          success: true,
          message: "Transaksi berhasil dibuat",
          transaction: {
            reference: transaction.reference,
            merchant_ref: transaction.merchant_ref,
            payment_method: transaction.payment_method,
            payment_name: transaction.payment_name,
            amount: parseFloat(transaction.amount),
            fee: parseFloat(transaction.fee),
            total_amount: parseFloat(transaction.total_amount),
            status: transaction.status,
            created_at: transaction.created_at,
            expired_at: transaction.expired_at,
            payment_code: transaction.payment_code,
            qr_url: transaction.qr_url,
            plan_name: plan.name,
            instructions: transaction.instructions ? JSON.parse(transaction.instructions) : []
          }
        });
      } catch (dbError) {
        console.error("[PURCHASE] Database error:", dbError);
        
        // Tetap return success dengan data dari Tripay meskipun gagal save ke DB
        return res.json({
          success: true,
          message: "Transaksi berhasil dibuat di Tripay (warning: database save issue)",
          transaction: {
            reference: tripayData.reference,
            merchant_ref: tripayData.merchant_ref,
            payment_method: payment_method,
            payment_name: selectedMethod.name,
            amount: amount,
            fee: selectedMethod.fee || 0,
            total_amount: tripayData.amount,
            status: 'UNPAID',
            created_at: new Date(),
            expired_at: new Date(tripayData.expired_time * 1000),
            payment_code: tripayData.pay_code || null,
            qr_url: tripayData.qr_url || null,
            plan_name: plan.name,
            instructions: tripayData.instructions || []
          }
        });
      }
    } catch (tripayError) {
      console.error("[PURCHASE] Tripay API Error:", tripayError.response?.data || tripayError.message);
      return res.status(500).json({
        success: false,
        message: "Gagal membuat transaksi di Tripay: " + 
          (tripayError.response?.data?.message || tripayError.message)
      });
    }
  } catch (error) {
    console.error("[PURCHASE] Global error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error: " + (error.message || 'Terjadi kesalahan')
    });
  }
};

const purchaseSubscriptionDemo = async (req, res) => {
  try {
    console.log("[DEMO] Demo purchase subscription called");
    
    // Data transaksi dummy yang sudah diformat dengan benar
    const dummyTransaction = {
      reference: "DEMO-TRX-" + Date.now(),
      merchant_ref: "DEMO-MERCHANT-" + Date.now(),
      payment_method: "QRIS",
      payment_name: "QRIS",
      amount: 100000,
      fee: 800,
      total_amount: 100800,
      status: "UNPAID",
      created_at: new Date().toISOString(),
      expired_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      payment_code: "DEMO123456789",
      qr_url: "https://tripay.co.id/qr/sample.png",
      plan_name: "Demo Plan",
      instructions: [
        {
          title: "Cara Pembayaran QRIS (DEMO)",
          steps: [
            "Buka aplikasi e-wallet atau mobile banking Anda",
            "Pilih menu Scan QR atau QRIS",
            "Scan QR code yang tersedia",
            "Periksa detail transaksi",
            "Masukkan PIN atau password Anda",
            "Pembayaran selesai (DEMO MODE)"
          ]
        }
      ]
    };
    
    return res.json({
      success: true,
      message: "Transaksi demo berhasil dibuat",
      transaction: dummyTransaction
    });
  } catch (error) {
    console.error("[DEMO] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error: " + (error.message || 'Terjadi kesalahan')
    });
  }
};

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
  purchaseSubscription,
  purchaseSubscriptionDemo,
  debugSubscriptions
};