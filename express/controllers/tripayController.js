const { User, Subscription, SubscriptionPlan, Setting, Transaction, db } = require("../models");
const axios = require("axios");
const crypto = require("crypto");

// Konfigurasi Tripay
const TRIPAY_API_KEY = process.env.TRIPAY_API_KEY || "5CVDH22vZjFAWySB7lIpCDRd2hXIBnycUA1tvHBa";
const TRIPAY_PRIVATE_KEY = process.env.TRIPAY_PRIVATE_KEY || "4PAWA-uFTIU-H6Ced-yK6Bz-f0AGl";
const TRIPAY_MERCHANT_CODE = process.env.TRIPAY_MERCHANT_CODE || "T44798";
const TRIPAY_PROXY_URL = process.env.TRIPAY_PROXY_URL || "https://callback.kinterstore.com/api/tripay-proxy";
const CALLBACK_URL = process.env.CALLBACK_URL || "https://callback.kinterstore.com/api/tripay/callback/autobot";
const RETURN_URL = process.env.FRONTEND_URL || "https://kinterstore.my.id";

// Hitung Unix timestamp untuk 24 jam dari sekarang
const expiredTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // Sekarang + 24 jam dalam detik

// Helper function untuk membuat instance axios yang menggunakan proxy
const getTripayAxios = () => {
  return axios.create({
    baseURL: TRIPAY_PROXY_URL,
    timeout: 15000,
    headers: {
      'X-Tripay-API-Key': TRIPAY_API_KEY,
      'Content-Type': 'application/json'
    }
  });
};

// Mendapatkan status Tripay
exports.getTripayStatus = async (req, res) => {
  try {
    console.log("Getting Tripay status");
    
    // Coba ambil dari database
    const enabledSetting = await Setting.findOne({
      where: { key: 'tripay_enabled' }
    });
    
    console.log("Tripay enabled setting:", enabledSetting);
    
    // Jika ditemukan, kembalikan nilai dari database
    if (enabledSetting) {
      return res.json({
        enabled: enabledSetting.value === 'true'
      });
    }
    
    // Jika tidak ditemukan, kembalikan default (aktif)
    return res.json({
      enabled: true
    });
  } catch (error) {
    console.error("Error getting Tripay status:", error);
    return res.json({
      enabled: true  // Default jika terjadi error
    });
  }
};

// Mengatur status Tripay (aktif/nonaktif)
exports.updateTripayStatus = async (req, res) => {
  try {
    console.log("Menerima permintaan pembaruan pengaturan Tripay:", req.body);
    
    // Hanya admin yang bisa mengatur status Tripay
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        success: false, 
        message: 'Akses ditolak'
      });
    }
    
    const { tripay_enabled, tripay_api_key, tripay_private_key, tripay_merchant_code } = req.body;
    
    try {
      console.log("Setting model:", Setting);
      console.log("Trying to update or create settings");
      
      // Update pengaturan tripay_enabled
      let enabledSetting = await Setting.findOne({ where: { key: 'tripay_enabled' } });
      if (enabledSetting) {
        enabledSetting.value = tripay_enabled.toString();
        await enabledSetting.save();
        console.log("Updated tripay_enabled setting");
      } else {
        await Setting.create({ key: 'tripay_enabled', value: tripay_enabled.toString() });
        console.log("Created tripay_enabled setting");
      }
      
      // Update pengaturan API key jika disediakan
      if (tripay_api_key && tripay_api_key !== '********') {
        let apiKeySetting = await Setting.findOne({ where: { key: 'tripay_api_key' } });
        if (apiKeySetting) {
          apiKeySetting.value = tripay_api_key;
          await apiKeySetting.save();
          console.log("Updated tripay_api_key setting");
        } else {
          await Setting.create({ key: 'tripay_api_key', value: tripay_api_key });
          console.log("Created tripay_api_key setting");
        }
        
        // Update global config
        if (global.TRIPAY_CONFIG) {
          global.TRIPAY_CONFIG.API_KEY = tripay_api_key;
        }
      }
      
      // Update pengaturan private key jika disediakan
      if (tripay_private_key && tripay_private_key !== '********') {
        let privateKeySetting = await Setting.findOne({ where: { key: 'tripay_private_key' } });
        if (privateKeySetting) {
          privateKeySetting.value = tripay_private_key;
          await privateKeySetting.save();
          console.log("Updated tripay_private_key setting");
        } else {
          await Setting.create({ key: 'tripay_private_key', value: tripay_private_key });
          console.log("Created tripay_private_key setting");
        }
        
        // Update global config
        if (global.TRIPAY_CONFIG) {
          global.TRIPAY_CONFIG.PRIVATE_KEY = tripay_private_key;
        }
      }
      
      // Update pengaturan merchant code jika disediakan
      if (tripay_merchant_code && tripay_merchant_code !== '********') {
        let merchantCodeSetting = await Setting.findOne({ where: { key: 'tripay_merchant_code' } });
        if (merchantCodeSetting) {
          merchantCodeSetting.value = tripay_merchant_code;
          await merchantCodeSetting.save();
          console.log("Updated tripay_merchant_code setting");
        } else {
          await Setting.create({ key: 'tripay_merchant_code', value: tripay_merchant_code });
          console.log("Created tripay_merchant_code setting");
        }
        
        // Update global config
        if (global.TRIPAY_CONFIG) {
          global.TRIPAY_CONFIG.MERCHANT_CODE = tripay_merchant_code;
        }
      }
      
      console.log("Pengaturan Tripay berhasil disimpan ke database");
      
      return res.json({
        success: true,
        message: 'Pengaturan Tripay berhasil disimpan'
      });
    } catch (dbError) {
      console.error("Error menyimpan ke database:", dbError);
      return res.status(500).json({
        success: false,
        message: 'Gagal memperbarui pengaturan Tripay: ' + dbError.message
      });
    }
  } catch (error) {
    console.error("Error memperbarui pengaturan Tripay:", error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui pengaturan Tripay: ' + error.message
    });
  }
};

// Mendapatkan metode pembayaran yang tersedia
exports.getPaymentChannels = async (req, res) => {
  try {
    console.log("Fetching payment channels - safe mode");
    
    // PERBAIKAN: Selalu return fallback data dulu sambil mencoba API
    const fallbackChannels = [
      { 
        code: 'QRIS', 
        name: 'QRIS', 
        group: 'QRIS', 
        fee: 800, 
        active: true,
        type: 'qris'
      },
      { 
        code: 'BRIVA', 
        name: 'Bank BRI', 
        group: 'Virtual Account', 
        fee: 4000, 
        active: true,
        type: 'virtual_account'
      },
      { 
        code: 'MANDIRIVA', 
        name: 'Bank Mandiri', 
        group: 'Virtual Account', 
        fee: 4000, 
        active: true,
        type: 'virtual_account'
      },
      { 
        code: 'BCAVA', 
        name: 'Bank BCA', 
        group: 'Virtual Account', 
        fee: 4000, 
        active: true,
        type: 'virtual_account'
      }
    ];
    
    // Coba ambil dari API Tripay di background
    try {
      // Periksa terlebih dahulu apakah Tripay diaktifkan
      const tripayEnabled = await isTripayEnabled();
      
      if (!tripayEnabled) {
        console.log("Tripay disabled, returning fallback channels");
        return res.json(fallbackChannels);
      }
      
      // Pastikan TRIPAY_API_KEY ada
      if (!TRIPAY_API_KEY) {
        console.warn("TRIPAY_API_KEY not found, returning fallback");
        return res.json(fallbackChannels);
      }
      
      console.log("Attempting to fetch from Tripay API...");
      
      // Buat instance axios yang menggunakan proxy
      const tripayAxios = getTripayAxios();
      
      // Set timeout yang lebih pendek untuk menghindari hang
      const response = await Promise.race([
        tripayAxios.get('/merchant/payment-channel'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 8000)
        )
      ]);
      
      console.log("Tripay API response received, status:", response.status);
      
      // Filter hanya channel yang aktif
      const activeChannels = response.data.data.filter(channel => channel.active);
      
      if (activeChannels && activeChannels.length > 0) {
        console.log("Using real Tripay channels:", activeChannels.length);
        return res.json(activeChannels);
      } else {
        console.log("No active channels from Tripay, using fallback");
        return res.json(fallbackChannels);
      }
      
    } catch (apiError) {
      console.warn("Tripay API error, using fallback channels:", apiError.message);
      // Tidak throw error, langsung return fallback
      return res.json(fallbackChannels);
    }
    
  } catch (error) {
    console.error("Error in getPaymentChannels:", error);
    
    // Selalu return fallback channels untuk menghindari frontend crash
    const fallbackChannels = [
      { code: 'QRIS', name: 'QRIS', group: 'QRIS', fee: 800, active: true },
      { code: 'BRIVA', name: 'Bank BRI', group: 'Virtual Account', fee: 4000, active: true }
    ];
    
    return res.json(fallbackChannels);
  }
};

// Membuat transaksi baru
exports.createTransaction = async (req, res) => {
  try {
    const { 
      plan_id, 
      payment_method, 
      customer_name, 
      customer_email, 
      customer_phone 
    } = req.body;
    
    const userId = req.userId;
    
    // Validasi data
    if (!plan_id || !payment_method) {
      return res.status(400).json({ 
        success: false, 
        message: "Data tidak lengkap" 
      });
    }
    
    // Periksa apakah Tripay diaktifkan
    const tripayEnabled = await isTripayEnabled();
    
    if (!tripayEnabled) {
      return res.status(400).json({ 
        success: false, 
        message: "Tripay payment gateway saat ini tidak aktif"
      });
    }
    
    // Ambil data paket langganan
    const plan = await SubscriptionPlan.findByPk(plan_id);
    if (!plan) {
      return res.status(404).json({ 
        success: false, 
        message: "Paket langganan tidak ditemukan" 
      });
    }
    
    // Ambil data user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User tidak ditemukan" 
      });
    }
    
    // Generate merchant reference
    const merchantRef = `SUB-${userId}-${Date.now()}`;

    // PERBAIKAN: Pastikan price adalah integer dengan pendekatan yang lebih handal
    let priceInt;
    try {
      // Jika price adalah string, konversi ke number terlebih dahulu
      const numericPrice = typeof plan.price === 'string' ? 
                          parseFloat(plan.price.replace(/[^\d.]/g, '')) : 
                          parseFloat(plan.price);
      
      // Pastikan nilai adalah integer (tanpa desimal)
      priceInt = Math.floor(numericPrice);
      
      // Validasi hasil konversi
      if (isNaN(priceInt) || !isFinite(priceInt) || priceInt <= 0) {
        console.error("Konversi harga gagal, menggunakan nilai default:", { 
          original: plan.price,
          parsed: numericPrice,
          result: priceInt
        });
        // Gunakan nilai minimum untuk fallback jika konversi gagal
        priceInt = 1000;
      }
      
      console.log("Harga asli:", plan.price);
      console.log("Harga setelah konversi:", priceInt);
    } catch (error) {
      console.error("Error saat konversi harga:", error);
      // Gunakan nilai default
      priceInt = 1000;
    }

    // Generate signature dengan priceInt
    const signature = crypto
      .createHmac('sha256', TRIPAY_PRIVATE_KEY)
      .update(TRIPAY_MERCHANT_CODE + merchantRef + priceInt)
      .digest('hex');
      
    // Buat instance axios yang menggunakan proxy
    const tripayAxios = getTripayAxios();
    
    // Ambil data metode pembayaran via proxy
    const paymentChannelsResponse = await tripayAxios.get('/merchant/payment-channel');
    
    const paymentChannels = paymentChannelsResponse.data.data;
    const selectedMethod = paymentChannels.find(m => m.code === payment_method);
    
    if (!selectedMethod) {
      return res.status(400).json({ 
        success: false, 
        message: "Metode pembayaran tidak valid" 
      });
    }

    // PERBAIKAN: Data untuk request ke Tripay dengan perhatian khusus pada format item
    const tripayPayload = {
      method: payment_method,
      merchant_ref: merchantRef,
      amount: priceInt,
      customer_name: customer_name || user.username || '',
      customer_email: customer_email || user.email || '',
      customer_phone: customer_phone || '',
      order_items: [{
        name: `Langganan ${plan.name}`,
        price: priceInt,
        quantity: 1,
        subtotal: priceInt // Tambahkan subtotal untuk memastikan konsistensi
      }],
      callback_url: CALLBACK_URL,
      return_url: `${RETURN_URL}/subscription`,
      expired_time: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 jam dalam format Unix timestamp
      signature: signature
    };

    console.log("Payload Tripay (perbaikan format):", JSON.stringify(tripayPayload, null, 2));
    
    // Tambahkan logging untuk debugging
    console.log("Mengirim payload ke Tripay via proxy:", TRIPAY_PROXY_URL);
    console.log("Merchant Code:", TRIPAY_MERCHANT_CODE);
    console.log("API Key:", TRIPAY_API_KEY.substring(0, 5) + "...");
    
    // Buat transaksi di Tripay via proxy
    const tripayResponse = await tripayAxios.post('/transaction/create', tripayPayload);
    
    console.log("Respons Tripay (status):", tripayResponse.status);
    console.log("Respons Tripay (headers):", JSON.stringify(tripayResponse.headers, null, 2));
    
    if (!tripayResponse.data.success) {
      console.error("Error dari Tripay:", tripayResponse.data);
      return res.status(400).json({
        success: false,
        message: tripayResponse.data.message || "Gagal membuat transaksi di Tripay",
        error_data: tripayResponse.data
      });
    }
    
    // Setelah mendapatkan data transaksi dari Tripay
    const tripayData = tripayResponse.data.data;
    console.log("Data transaksi dari Tripay:", JSON.stringify(tripayData, null, 2));
    
    // Simpan data transaksi ke database dengan penanganan error yang lebih baik
    try {
      // Periksa apakah model Transaction tersedia
      if (!Transaction) {
        throw new Error("Model Transaction tidak tersedia");
      }
      
      // Periksa apakah referensi sudah ada di database
      const existingTransaction = await Transaction.findOne({
        where: { reference: tripayData.reference }
      });
      
      if (existingTransaction) {
        console.log(`Transaksi dengan referensi ${tripayData.reference} sudah ada di database`);
        
        // Return data transaksi yang sudah ada
        return res.json({
          success: true,
          message: "Transaksi sudah dibuat sebelumnya",
          transaction: {
            reference: existingTransaction.reference,
            merchant_ref: existingTransaction.merchant_ref,
            payment_method: existingTransaction.payment_method,
            payment_name: existingTransaction.payment_name,
            amount: parseFloat(existingTransaction.amount),
            fee: parseFloat(existingTransaction.fee || 0),
            total_amount: parseFloat(existingTransaction.total_amount),
            status: existingTransaction.status,
            created_at: existingTransaction.created_at,
            expired_at: existingTransaction.expired_at,
            payment_code: existingTransaction.payment_code,
            qr_url: existingTransaction.qr_url,
            plan_name: plan.name,
            instructions: existingTransaction.instructions ? JSON.parse(existingTransaction.instructions) : []
          }
        });
      }
      
      // Persiapkan data untuk disimpan ke database
      const transactionData = {
        reference: tripayData.reference,
        merchant_ref: tripayData.merchant_ref,
        user_id: userId,
        plan_id: plan_id,
        payment_method: payment_method,
        payment_name: selectedMethod.name,
        amount: priceInt,
        fee: selectedMethod.fee || 0,
        total_amount: tripayData.amount,
        status: 'UNPAID',
        created_at: new Date(),
        expired_at: new Date(tripayData.expired_time * 1000),
        payment_code: tripayData.pay_code || null,
        qr_url: tripayData.qr_url || null,
        instructions: JSON.stringify(tripayData.instructions || [])
      };
      
      // Log data yang akan disimpan untuk debugging
      console.log("Data yang akan disimpan ke database:", JSON.stringify(transactionData, null, 2));
      
      // Coba simpan dengan validasi tambahan
      const transaction = await Transaction.create(transactionData);
      
      console.log("Transaksi berhasil disimpan ke database:", transaction.id);
      
      // Return response
      return res.json({
        success: true,
        message: "Transaksi berhasil dibuat",
        transaction: {
          reference: transaction.reference,
          merchant_ref: transaction.merchant_ref,
          payment_method: transaction.payment_method,
          payment_name: transaction.payment_name,
          amount: parseFloat(transaction.amount),
          fee: parseFloat(transaction.fee || 0),
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
      console.error("Error menyimpan transaksi ke database:", dbError);
      
      // Log detail error untuk debugging
      console.error("Detail error database:", {
        name: dbError.name,
        message: dbError.message,
        stack: dbError.stack,
        sql: dbError.sql, // Jika ada SQL error
        parameters: dbError.parameters // Jika ada parameter yang bermasalah
      });
      
      // Coba tangani beberapa error database umum
      if (dbError.name === 'SequelizeValidationError') {
        const validationErrors = dbError.errors.map(err => ({
          field: err.path,
          message: err.message,
          value: err.value
        }));
        console.error("Validation errors:", validationErrors);
      }
      else if (dbError.name === 'SequelizeUniqueConstraintError') {
        console.error("Unique constraint error:", dbError.fields);
        
        // Coba cari transaksi yang sudah ada dengan reference yang sama
        try {
          const existingTransaction = await Transaction.findOne({
            where: { reference: tripayData.reference }
          });
          
          if (existingTransaction) {
            console.log(`Transaksi dengan referensi ${tripayData.reference} ditemukan setelah error unik`);
            
            // Return data transaksi yang sudah ada
            return res.json({
              success: true,
              message: "Transaksi sudah dibuat sebelumnya",
              transaction: {
                reference: existingTransaction.reference,
                merchant_ref: existingTransaction.merchant_ref,
                payment_method: existingTransaction.payment_method,
                payment_name: existingTransaction.payment_name,
                amount: parseFloat(existingTransaction.amount),
                fee: parseFloat(existingTransaction.fee || 0),
                total_amount: parseFloat(existingTransaction.total_amount),
                status: existingTransaction.status,
                created_at: existingTransaction.created_at,
                expired_at: existingTransaction.expired_at,
                payment_code: existingTransaction.payment_code,
                qr_url: existingTransaction.qr_url,
                plan_name: plan.name,
                instructions: existingTransaction.instructions ? JSON.parse(existingTransaction.instructions) : []
              }
            });
          }
        } catch (findError) {
          console.error("Error mencari transaksi yang sudah ada:", findError);
        }
      }
      
      // Transaksi berhasil di Tripay tapi gagal menyimpan ke database
      // Kembalikan data dari Tripay untuk menghindari kesalahan pengguna
      return res.json({
        success: true,
        message: "Transaksi berhasil dibuat di Tripay tetapi ada masalah dengan database. Mohon simpan referensi transaksi Anda.",
        transaction: {
          reference: tripayData.reference,
          merchant_ref: tripayData.merchant_ref,
          payment_method: payment_method,
          payment_name: selectedMethod.name,
          amount: priceInt,
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
  } catch (error) {

    console.error("Error membuat transaksi:", error);
    console.error("Stack:", error.stack);
    
    // Tangani error dari API Tripay
    if (error.response) {
      console.error("Respons error dari Tripay:", error.response.data);
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data.message || "Gagal membuat transaksi",
        error_details: error.response.data
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Gagal membuat transaksi: " + error.message,
    });
  }
};

// Mendapatkan detail transaksi
exports.getTransactionDetail = async (req, res) => {
  try {
    const { reference } = req.params;
    const userId = req.userId;
    
    // Periksa apakah Tripay diaktifkan
    const tripayEnabled = await isTripayEnabled();
    
    if (!tripayEnabled) {
      return res.status(400).json({ 
        success: false, 
        message: "Tripay payment gateway saat ini tidak aktif"
      });
    }
    
    // Periksa transaksi di database terlebih dahulu
    const transaction = await Transaction.findOne({
      where: { reference },
      include: [{
        model: SubscriptionPlan,
        as: 'plan',
        attributes: ['name', 'duration_days']
      }]
    });
    
    // Jika admin, izinkan melihat semua transaksi
    // Jika user biasa, batasi hanya transaksi miliknya
    if (transaction && req.userRole !== 'admin' && transaction.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki akses ke transaksi ini"
      });
    }
    
    // Jika transaksi tidak ditemukan, coba ambil dari Tripay via proxy
    if (!transaction) {
      // Buat instance axios yang menggunakan proxy
      const tripayAxios = getTripayAxios();
      
      // Ambil detail transaksi dari Tripay via proxy
      const tripayResponse = await tripayAxios.get(`/transaction/detail?reference=${reference}`);
      
      const tripayData = tripayResponse.data.data;
      
      // Jika admin, izinkan melihat transaksi apa pun
      // Jika user biasa dan merchant_ref tidak mengandung ID-nya, tolak
      if (req.userRole !== 'admin' && !tripayData.merchant_ref.includes(`SUB-${userId}`)) {
        return res.status(403).json({
          success: false,
          message: "Anda tidak memiliki akses ke transaksi ini"
        });
      }
      
      return res.json({
        success: true,
        transaction: tripayData
      });
    }
    
    // Jika transaksi ditemukan di database, kembalikan datanya
    const formattedTransaction = {
      reference: transaction.reference,
      merchant_ref: transaction.merchant_ref,
      payment_method: transaction.payment_method,
      payment_name: transaction.payment_name,
      amount: parseFloat(transaction.amount),
      fee: parseFloat(transaction.fee),
      total_amount: parseFloat(transaction.total_amount),
      status: transaction.status,
      created_at: transaction.created_at,
      paid_at: transaction.paid_at,
      expired_at: transaction.expired_at,
      payment_code: transaction.payment_code,
      qr_url: transaction.qr_url,
      plan_name: transaction.plan ? transaction.plan.name : null,
      instructions: transaction.instructions ? JSON.parse(transaction.instructions) : null
    };
    
    return res.json({
      success: true,
      transaction: formattedTransaction
    });
  } catch (error) {
    console.error("Error fetching transaction detail:", error);
    
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data.message || "Gagal memuat detail transaksi",
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Gagal memuat detail transaksi",
    });
  }
};

// Menangani callback dari Tripay - VERSI YANG DIPERBAIKI
exports.handleCallback = async (req, res) => {
  let dbTransaction;
  
  try {
    console.log("=== TRIPAY CALLBACK RECEIVED ===");
    console.log("Body:", JSON.stringify(req.body, null, 2));
    console.log("Headers:", JSON.stringify(req.headers, null, 2));
    
    const { reference, merchant_ref, status, paid_at, amount } = req.body;
    
    if (!reference) {
      console.error("Reference tidak ditemukan di body");
      return res.status(400).json({
        success: false,
        message: 'Data tidak lengkap: Reference tidak ditemukan'
      });
    }
    
    console.log(`Processing callback for reference: ${reference}, status: ${status}`);
    
    // Mulai transaction database
    dbTransaction = await db.sequelize.transaction();
    
    // 3. CARI TRANSAKSI DI DATABASE
    let tripayTransaction;
    try {
      // Coba cari transaksi dengan include
      tripayTransaction = await Transaction.findOne({ 
        where: { reference },
        include: [
          {
            model: SubscriptionPlan,
            as: 'plan',
            attributes: ['id', 'name', 'duration_days', 'price']
          }
        ],
        transaction: dbTransaction
      });
    } catch (findError) {
      console.error("Error mencari transaksi dengan include:", findError.message);
      
      // Coba query tanpa include jika error
      tripayTransaction = await Transaction.findOne({ 
        where: { reference },
        transaction: dbTransaction
      });
    }
    
    if (!tripayTransaction) {
      console.error(`Transaksi tidak ditemukan: ${reference}`);
      await dbTransaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan'
      });
    }
    
    console.log(`Transaksi ditemukan: ${reference}, current status: ${tripayTransaction.status}`);
    console.log(`User ID: ${tripayTransaction.user_id}, Plan ID: ${tripayTransaction.plan_id}`);
    
    // 4. CEK APAKAH SUDAH DIPROSES SEBELUMNYA
    if (tripayTransaction.status === 'PAID') {
      console.log(`Transaksi ${reference} sudah dibayar sebelumnya`);
      await dbTransaction.commit();
      return res.json({
        success: true,
        message: 'Transaksi sudah diproses sebelumnya'
      });
    }
    
    // 5. UPDATE STATUS TRANSAKSI
    console.log(`Updating transaction status: ${tripayTransaction.status} -> ${status}`);
    tripayTransaction.status = status;
    
    if (status === 'PAID') {
      tripayTransaction.paid_at = paid_at ? new Date(paid_at) : new Date();
      console.log(`Transaksi ${reference} dibayar pada: ${tripayTransaction.paid_at}`);
    }
    
    await tripayTransaction.save({ transaction: dbTransaction });
    console.log(`Status transaksi berhasil diperbarui: ${reference}`);
    
    // 6. PROSES LANGGANAN JIKA STATUS PAID
    if (status === 'PAID') {
      const userId = tripayTransaction.user_id;
      let durationDays;
      
      // Ambil durasi dari relasi plan atau dari query tambahan
      if (tripayTransaction.plan && tripayTransaction.plan.duration_days) {
        durationDays = tripayTransaction.plan.duration_days;
        console.log(`Durasi dari relasi plan: ${durationDays} hari`);
      } else {
        // Ambil plan dari database
        console.log(`Plan tidak tersedia dalam relasi, mencari dari database...`);
        try {
          const plan = await SubscriptionPlan.findByPk(tripayTransaction.plan_id, {
            transaction: dbTransaction
          });
          
          if (plan) {
            durationDays = plan.duration_days;
            console.log(`Durasi dari database: ${durationDays} hari`);
          } else {
            throw new Error(`Plan dengan ID ${tripayTransaction.plan_id} tidak ditemukan`);
          }
        } catch (planError) {
          console.error(`Error mencari plan:`, planError);
          await dbTransaction.rollback();
          return res.status(500).json({
            success: false,
            message: 'Error saat mencari data plan: ' + planError.message
          });
        }
      }
      
      if (!durationDays) {
        console.error(`Durasi plan tidak ditemukan untuk transaksi: ${reference}`);
        await dbTransaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Data durasi langganan tidak lengkap'
        });
      }
      
      console.log(`Memproses langganan untuk user ${userId}, durasi: ${durationDays} hari`);
      
      try {
        // CEK LANGGANAN AKTIF YANG ADA
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
        
        if (activeSubscription) {
          // PERPANJANG LANGGANAN YANG ADA
          console.log(`Memperpanjang langganan yang ada (ID: ${activeSubscription.id}) untuk user ${userId}`);
          console.log(`End date sebelumnya: ${activeSubscription.end_date}`);
          
          const currentEndDate = new Date(activeSubscription.end_date);
          const newEndDate = new Date(currentEndDate);
          newEndDate.setDate(currentEndDate.getDate() + durationDays);
          
          console.log(`End date baru: ${newEndDate}`);
          
          await activeSubscription.update({
            end_date: newEndDate,
            payment_status: 'paid',
            payment_method: tripayTransaction.payment_method,
            tripay_reference: reference,
            tripay_merchant_ref: merchant_ref,
            transaction_id: tripayTransaction.id
          }, { transaction: dbTransaction });
          
          console.log(`Langganan berhasil diperpanjang hingga: ${newEndDate}`);
        } else {
          // BUAT LANGGANAN BARU
          console.log(`Membuat langganan baru untuk user ${userId}`);
          
          const startDate = new Date();
          const endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + durationDays);
          
          console.log(`Langganan baru: ${startDate} s/d ${endDate}`);
          
          const newSubscription = await Subscription.create({
            user_id: userId,
            start_date: startDate,
            end_date: endDate,
            status: 'active',
            payment_status: 'paid',
            payment_method: tripayTransaction.payment_method,
            tripay_reference: reference,
            tripay_merchant_ref: merchant_ref,
            transaction_id: tripayTransaction.id
          }, { transaction: dbTransaction });
          
          console.log(`Langganan baru berhasil dibuat (ID: ${newSubscription.id})`);
        }
        
      } catch (subError) {
        console.error("Error saat memproses langganan:", subError);
        console.error("Stack:", subError.stack);
        
        // Rollback transaction jika ada error
        await dbTransaction.rollback();
        return res.status(500).json({
          success: false,
          message: 'Error saat memproses langganan: ' + subError.message
        });
      }
    }
    
    // 7. COMMIT SEMUA PERUBAHAN
    await dbTransaction.commit();
    console.log(`Callback diproses dengan sukses untuk ${reference}`);
    
    // 8. RESPONSE SUKSES KE TRIPAY
    return res.json({
      success: true,
      message: 'Callback diproses dengan sukses'
    });
    
  } catch (error) {
    // ROLLBACK JIKA ADA ERROR
    if (dbTransaction) {
      try {
        await dbTransaction.rollback();
      } catch (rollbackError) {
        console.error("Error saat rollback:", rollbackError);
      }
    }
    
    console.error("Error menangani callback Tripay:", error);
    console.error("Stack:", error.stack);
    
    // Return 200 OK meskipun error untuk menghindari retry yang berlebihan
    return res.status(200).json({
      success: false,
      message: 'Error terjadi, tapi diakui oleh server'
    });
  }
};

// Memeriksa status transaksi
exports.getTransactionStatus = async (req, res) => {
  try {
    const { reference } = req.params;
    const userId = req.userId;
    
    console.log(`Checking status for transaction ${reference}`);
    
    // Cari transaksi di database
    let transaction;
    try {
      transaction = await Transaction.findOne({ 
        where: { reference },
        include: [{
          model: SubscriptionPlan,
          as: 'plan',
          required: false
        }]
      });
    } catch (findError) {
      console.warn("Error with include, trying basic query");
      transaction = await Transaction.findOne({ where: { reference } });
    }
    
    // Jika admin, izinkan melihat semua transaksi
    // Jika user biasa, batasi hanya transaksi miliknya
    if (transaction && req.userRole !== 'admin' && transaction.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki akses ke transaksi ini"
      });
    }
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan'
      });
    }
    
    try {
      // Periksa status di Tripay via proxy
      const tripayAxios = getTripayAxios();
      const tripayResponse = await tripayAxios.get(`/transaction/detail?reference=${reference}`);
      
      const tripayData = tripayResponse.data.data;
      
      // Update status di database jika berbeda
      if (transaction.status !== tripayData.status) {
        console.log(`Updating transaction status: ${transaction.status} -> ${tripayData.status}`);
        
        // Gunakan transaction database
        const dbTransaction = await db.sequelize.transaction();
        
        try {
          transaction.status = tripayData.status;
          
          if (tripayData.status === 'PAID' && !transaction.paid_at) {
            transaction.paid_at = tripayData.paid_at || new Date();
            
            // Jika status PAID, tambahkan atau perpanjang langganan
            const userId = transaction.user_id;
            let durationDays;
            
            if (transaction.plan) {
              durationDays = transaction.plan.duration_days;
            } else {
              // Ambil durasi dari database jika tidak ada di relasi
              const plan = await SubscriptionPlan.findByPk(transaction.plan_id);
              durationDays = plan ? plan.duration_days : null;
            }
            
            if (durationDays) {
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
              
              if (activeSubscription) {
                // Jika sudah ada langganan aktif, tambahkan durasi ke langganan yang ada
                const currentEndDate = new Date(activeSubscription.end_date);
                const newEndDate = new Date(currentEndDate.setDate(currentEndDate.getDate() + durationDays));
                
                await activeSubscription.update({
                  end_date: newEndDate,
                  payment_status: 'paid',
                  payment_method: transaction.payment_method,
                  tripay_reference: reference,
                  tripay_merchant_ref: transaction.merchant_ref,
                  transaction_id: transaction.id
                }, { transaction: dbTransaction });
                
                console.log(`Subscription extended until ${newEndDate}`);
              } else {
                // Jika belum ada langganan aktif, buat langganan baru
                const startDate = new Date();
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + durationDays);
                
                await Subscription.create({
                  user_id: userId,
                  start_date: startDate,
                  end_date: endDate,
                  status: 'active',
                  payment_status: 'paid',
                  payment_method: transaction.payment_method,
                  tripay_reference: reference,
                  tripay_merchant_ref: transaction.merchant_ref,
                  transaction_id: transaction.id
                }, { transaction: dbTransaction });
                
                console.log(`New subscription created until ${endDate}`);
              }
            }
          }
          
          await transaction.save({ transaction: dbTransaction });
          await dbTransaction.commit();
          
        } catch (updateError) {
          await dbTransaction.rollback();
          console.error("Error updating status:", updateError);
        }
      }
      
      return res.json({
        success: true,
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
          paid_at: transaction.paid_at,
          expired_at: transaction.expired_at,
          payment_code: transaction.payment_code,
          qr_url: transaction.qr_url,
          plan_name: transaction.plan ? transaction.plan.name : null
        }
      });
    } catch (error) {
      // Jika gagal mengambil dari Tripay, kembalikan data dari database
      console.error("Failed to get status from Tripay, returning database data:", error);
      
      return res.json({
        success: true,
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
          paid_at: transaction.paid_at,
          expired_at: transaction.expired_at,
          payment_code: transaction.payment_code,
          qr_url: transaction.qr_url,
          plan_name: transaction.plan ? transaction.plan.name : null
        },
        note: "Status diambil dari database lokal"
      });
    }
  } catch (error) {
    console.error("Error checking transaction status:", error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memeriksa status transaksi'
    });
  }
};

// Mendapatkan transaksi yang belum dibayar (pending)
exports.getPendingTransactions = async (req, res) => {
  try {
    const userId = req.userId;
    console.log("Fetching pending transactions for user:", userId);
    
    // Ambil data dari database
    try {
      const whereCondition = req.userRole === 'admin' 
        ? { status: 'UNPAID' } 
        : { user_id: userId, status: 'UNPAID' };
      
      // Coba dengan direct SQL query dulu untuk debugging
      const [rawTransactions] = await db.sequelize.query(
        `SELECT * FROM transactions 
         WHERE user_id = ? AND status = 'UNPAID' 
         ORDER BY created_at DESC LIMIT 50`,
        { 
          replacements: [userId],
          type: db.sequelize.QueryTypes.SELECT 
        }
      );
      
      console.log(`Raw SQL found ${rawTransactions.length} pending transactions`);
      
      // Kemudian coba dengan Sequelize ORM
      const transactions = await Transaction.findAll({
        where: whereCondition,
        include: [{
          model: SubscriptionPlan,
          as: 'plan',
          attributes: ['name', 'duration_days'],
          required: false
        }],
        order: [['created_at', 'DESC']],
        limit: 50
      });
      
      console.log(`ORM found ${transactions.length} pending transactions`);
      
      // Format data transaksi
      const formattedTransactions = transactions.map(trans => {
        // Pastikan JSON.parse hanya dipanggil jika instructions adalah string
        let instructions = [];
        if (trans.instructions) {
          try {
            instructions = typeof trans.instructions === 'string' 
              ? JSON.parse(trans.instructions) 
              : trans.instructions;
          } catch (e) {
            console.warn("Error parsing instructions:", e.message);
          }
        }
        
        return {
          reference: trans.reference,
          merchant_ref: trans.merchant_ref,
          payment_method: trans.payment_method,
          payment_name: trans.payment_name,
          amount: parseFloat(trans.amount),
          fee: parseFloat(trans.fee || 0),
          total_amount: parseFloat(trans.total_amount),
          status: trans.status,
          created_at: trans.created_at,
          expired_at: trans.expired_at,
          payment_code: trans.payment_code,
          qr_url: trans.qr_url,
          plan_name: trans.plan ? trans.plan.name : null,
          instructions: instructions
        };
      });
      
      return res.json(formattedTransactions);
    } catch (dbError) {
      console.error("Database error:", dbError.message);
      
      // Jika query Sequelize gagal, coba dengan raw query
      try {
        const [transactions] = await db.sequelize.query(
          `SELECT t.*, sp.name as plan_name
           FROM transactions t
           LEFT JOIN SubscriptionPlans sp ON t.plan_id = sp.id
           WHERE t.user_id = ? AND t.status = 'UNPAID'
           ORDER BY t.created_at DESC LIMIT 50`,
          { 
            replacements: [userId],
            type: db.sequelize.QueryTypes.SELECT 
          }
        );
        
        const formattedTransactions = transactions.map(trans => {
          let instructions = [];
          if (trans.instructions) {
            try {
              instructions = typeof trans.instructions === 'string' 
                ? JSON.parse(trans.instructions) 
                : trans.instructions;
            } catch (e) {}
          }
          
          return {
            reference: trans.reference,
            merchant_ref: trans.merchant_ref,
            payment_method: trans.payment_method,
            payment_name: trans.payment_name,
            amount: parseFloat(trans.amount),
            fee: parseFloat(trans.fee || 0),
            total_amount: parseFloat(trans.total_amount),
            status: trans.status,
            created_at: trans.created_at,
            expired_at: trans.expired_at,
            payment_code: trans.payment_code,
            qr_url: trans.qr_url,
            plan_name: trans.plan_name,
            instructions: instructions
          };
        });
        
        return res.json(formattedTransactions);
      } catch (rawError) {
        console.error("Raw query error:", rawError.message);
        return res.json([]);
      }
    }
  } catch (error) {
    console.error("Error fetching pending transactions:", error);
    return res.json([]); // Return empty array
  }
};

// Perbaiki fungsi getTransactionHistory dengan pendekatan yang sama
exports.getTransactionHistory = async (req, res) => {
  try {
    const userId = req.userId;
    console.log("Fetching transaction history for user:", userId);
    
    try {
      const whereCondition = req.userRole === 'admin' 
        ? { 
            [db.Sequelize.Op.or]: [
              { status: 'PAID' },
              { status: 'EXPIRED' },
              { status: 'FAILED' }
            ]
          } 
        : { 
            user_id: userId,
            [db.Sequelize.Op.or]: [
              { status: 'PAID' },
              { status: 'EXPIRED' },
              { status: 'FAILED' }
            ]
          };
      
      // Coba dengan direct SQL query untuk debugging
      const [rawTransactions] = await db.sequelize.query(
        `SELECT t.*, sp.name as plan_name
         FROM transactions t
         LEFT JOIN SubscriptionPlans sp ON t.plan_id = sp.id
         WHERE t.user_id = ? AND (t.status = 'PAID' OR t.status = 'EXPIRED' OR t.status = 'FAILED')
         ORDER BY t.created_at DESC LIMIT 100`,
        { 
          replacements: [userId],
          type: db.sequelize.QueryTypes.SELECT 
        }
      );
      
      console.log(`Raw SQL found ${rawTransactions.length} transaction history records`);
      
      // Kemudian coba dengan Sequelize ORM
      const transactions = await Transaction.findAll({
        where: whereCondition,
        include: [{
          model: SubscriptionPlan,
          as: 'plan',
          attributes: ['name', 'duration_days'],
          required: false
        }],
        order: [['created_at', 'DESC']],
        limit: 100
      });
      
      console.log(`ORM found ${transactions.length} transaction history records`);
      
      // Format data transaksi
      const formattedTransactions = transactions.map(trans => ({
        reference: trans.reference,
        merchant_ref: trans.merchant_ref,
        payment_method: trans.payment_method,
        payment_name: trans.payment_name,
        amount: parseFloat(trans.amount),
        fee: parseFloat(trans.fee || 0),
        total_amount: parseFloat(trans.total_amount),
        status: trans.status,
        created_at: trans.created_at,
        paid_at: trans.paid_at,
        expired_at: trans.expired_at,
        plan_name: trans.plan ? trans.plan.name : null
      }));
      
      return res.json(formattedTransactions);
    } catch (dbError) {
      console.error("Database error:", dbError.message);
      
      // Fallback ke raw query jika ORM gagal
      try {
        const [transactions] = await db.sequelize.query(
          `SELECT t.*, sp.name as plan_name
           FROM transactions t
           LEFT JOIN SubscriptionPlans sp ON t.plan_id = sp.id
           WHERE t.user_id = ? AND (t.status = 'PAID' OR t.status = 'EXPIRED' OR t.status = 'FAILED')
           ORDER BY t.created_at DESC LIMIT 100`,
          { 
            replacements: [userId],
            type: db.sequelize.QueryTypes.SELECT 
          }
        );
        
        const formattedTransactions = transactions.map(trans => ({
          reference: trans.reference,
          merchant_ref: trans.merchant_ref,
          payment_method: trans.payment_method,
          payment_name: trans.payment_name,
          amount: parseFloat(trans.amount),
          fee: parseFloat(trans.fee || 0),
          total_amount: parseFloat(trans.total_amount),
          status: trans.status,
          created_at: trans.created_at,
          paid_at: trans.paid_at,
          expired_at: trans.expired_at,
          plan_name: trans.plan_name
        }));
        
        return res.json(formattedTransactions);
      } catch (rawError) {
        console.error("Raw query error:", rawError.message);
        return res.json([]);
      }
    }
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    return res.json([]);
  }
};

// Khusus admin: mendapatkan semua transaksi
exports.getAllTransactions = async (req, res) => {
  try {
    // Hanya admin yang bisa mengakses endpoint ini
    if (req.userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak'
      });
    }
    
    console.log("Mengambil semua data transaksi Tripay");
    
    try {
      // Gunakan raw query untuk memastikan data lengkap
      const [rawTransactions] = await db.sequelize.query(`
        SELECT t.*, u.username, u.email, p.name as plan_name
        FROM transactions t
        LEFT JOIN Users u ON t.user_id = u.id
        LEFT JOIN SubscriptionPlans p ON t.plan_id = p.id
        ORDER BY t.created_at DESC
      `);
      
      console.log(`Ditemukan ${rawTransactions.length} transaksi dari database`);
      
      if (rawTransactions.length === 0) {
        console.log("Tidak ada transaksi di database, memeriksa apakah tabel ada...");
        
        // Periksa apakah tabel ada
        try {
          await db.sequelize.query("SELECT 1 FROM transactions LIMIT 1");
          console.log("Tabel transactions ada tapi kosong");
        } catch (tableError) {
          console.error("Error memeriksa tabel transactions:", tableError.message);
          // Tabel mungkin tidak ada atau nama berbeda
        }
      }
      
      return res.json(rawTransactions);
    } catch (queryError) {
      console.error("Error query database:", queryError);
      
      // Coba pendekatan alternatif dengan ORM
      try {
        console.log("Mencoba query ORM alternatif");
        const transactions = await Transaction.findAll({
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'email'],
              required: false
            },
            {
              model: SubscriptionPlan,
              as: 'plan',
              attributes: ['id', 'name', 'duration_days'],
              required: false
            }
          ],
          order: [['created_at', 'DESC']]
        });
        
        console.log(`ORM query menemukan ${transactions.length} transaksi`);
        
        // Transform ke format yang diharapkan frontend
        const formattedTransactions = transactions.map(transaction => {
          const plain = transaction.get({ plain: true });
          return {
            ...plain,
            username: plain.user?.username || 'Unknown User',
            email: plain.user?.email || '',
            plan_name: plain.plan?.name || 'Unknown Plan'
          };
        });
        
        return res.json(formattedTransactions);
      } catch (ormError) {
        console.error("Error ORM query:", ormError);
        
        // Jika semua query gagal, kembalikan array kosong
        return res.json([]);
      }
    }
  } catch (error) {
    console.error("Error fetching all transactions:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server: " + error.message
    });
  }
};

// Helper function untuk memeriksa apakah Tripay diaktifkan
async function isTripayEnabled() {
  try {
    const tripaySettings = await Setting.findOne({
      where: { key: 'tripay_enabled' }
    });
    
    if (tripaySettings) {
      return tripaySettings.value === 'true';
    }
    
    return true; // Default: aktif jika tidak ada setting
  } catch (error) {
    console.error("Error checking if Tripay is enabled:", error);
    return true; // Default: aktif jika terjadi error
  }
}

exports.createTransactionInternal = async (data) => {
  try {
    // Ambil data paket langganan
    const plan = await SubscriptionPlan.findByPk(data.plan_id);
    if (!plan) {
      throw new Error("Paket langganan tidak ditemukan");
    }
    
    // Ambil data user
    const user = await User.findByPk(data.userId);
    if (!user) {
      throw new Error("User tidak ditemukan");
    }
    
    // Generate merchant reference
    const merchantRef = `SUB-${data.userId}-${Date.now()}`;
    
    // Konversi price ke integer
    const priceInt = Math.floor(Number(plan.price));
    
    // Generate signature
    const signature = crypto
      .createHmac('sha256', TRIPAY_PRIVATE_KEY)
      .update(TRIPAY_MERCHANT_CODE + merchantRef + priceInt)
      .digest('hex');
    
    // Buat instance axios yang menggunakan proxy
    const tripayAxios = getTripayAxios();
    
    // Ambil data metode pembayaran via proxy
    const paymentChannelsResponse = await tripayAxios.get('/merchant/payment-channel');
    
    const paymentChannels = paymentChannelsResponse.data.data;
    const selectedMethod = paymentChannels.find(m => m.code === data.payment_method);
    
    if (!selectedMethod) {
      throw new Error("Metode pembayaran tidak valid");
    }
    
    const tripayPayload = {
      method: data.payment_method,
      merchant_ref: merchantRef,
      amount: priceInt,
      customer_name: data.customer_name || user.username || '',
      customer_email: data.customer_email || user.email || '',
      customer_phone: data.customer_phone || '',
      order_items: [{
        name: `Langganan ${plan.name}`,
        price: priceInt,
        quantity: 1
      }],
      callback_url: CALLBACK_URL,
      return_url: `${RETURN_URL}/subscription`,
      expired_time: expiredTime,
      signature: signature
    };
    
    // Buat transaksi di Tripay via proxy
    const tripayResponse = await tripayAxios.post('/transaction/create', tripayPayload);
    
    const tripayData = tripayResponse.data.data;
    
    // Simpan data transaksi ke database
    const transaction = await Transaction.create({
      reference: tripayData.reference,
      merchant_ref: tripayData.merchant_ref,
      user_id: data.userId,
      plan_id: data.plan_id,
      payment_method: data.payment_method,
      payment_name: selectedMethod.name,
      amount: priceInt,
      fee: selectedMethod.fee || 0,
      total_amount: tripayData.amount,
      status: 'UNPAID',
      created_at: new Date(),
      expired_at: new Date(expiredTime * 1000), // Konversi ke Date object
      payment_code: tripayData.pay_code || null,
      qr_url: tripayData.qr_url || null,
      instructions: JSON.stringify(tripayData.instructions)
    });
    
    // Return data transaksi
    return {
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
      instructions: JSON.parse(transaction.instructions)
    };
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw error;
  }
};

// Fungsi untuk memperbarui status semua transaksi yang pending
exports.updatePendingTransactions = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Ambil semua transaksi yang belum dibayar
    const whereCondition = req.userRole === 'admin' 
      ? { status: 'UNPAID' } 
      : { user_id: userId, status: 'UNPAID' };
      
    const pendingTransactions = await Transaction.findAll({
      where: whereCondition,
      limit: 20 // Batasi untuk performa
    });
    
    console.log(`Found ${pendingTransactions.length} pending transactions to update`);
    
    if (pendingTransactions.length === 0) {
      return res.json({
        success: true,
        message: 'Tidak ada transaksi yang perlu diperbarui',
        updated: 0
      });
    }
    
    // Buat instance axios yang menggunakan proxy
    const tripayAxios = getTripayAxios();
    
    // Array untuk menyimpan hasil update
    const updateResults = [];
    
    // Perbarui status satu per satu
    for (const transaction of pendingTransactions) {
      try {
        console.log(`Checking status for transaction ${transaction.reference}`);
        
        // Periksa status di Tripay
        const tripayResponse = await tripayAxios.get(`/transaction/detail?reference=${transaction.reference}`);
        const tripayData = tripayResponse.data.data;
        
        // Jika status berbeda, perbarui di database
        if (transaction.status !== tripayData.status) {
          console.log(`Updating status: ${transaction.reference} (${transaction.status} -> ${tripayData.status})`);
          
          // Update status
          transaction.status = tripayData.status;
          
          // Jika status PAID, set paid_at dan proses langganan
          if (tripayData.status === 'PAID') {
            transaction.paid_at = tripayData.paid_at || new Date();
            await transaction.save();
            
            // Proses langganan (menggunakan fungsi terpisah)
            const subscriptionResult = await processSubscription(transaction);
            
            updateResults.push({
              reference: transaction.reference,
              previous_status: 'UNPAID',
              new_status: 'PAID',
              subscription: subscriptionResult
            });
          } else {
            await transaction.save();
            
            updateResults.push({
              reference: transaction.reference,
              previous_status: 'UNPAID',
              new_status: tripayData.status
            });
          }
        } else {
          updateResults.push({
            reference: transaction.reference,
            status: transaction.status,
            no_change: true
          });
        }
      } catch (error) {
        console.error(`Error updating transaction ${transaction.reference}:`, error.message);
        
        updateResults.push({
          reference: transaction.reference,
          error: error.message
        });
      }
    }
    
    return res.json({
      success: true,
      message: 'Status transaksi berhasil diperbarui',
      updated: updateResults.filter(r => !r.no_change && !r.error).length,
      results: updateResults
    });
    
  } catch (error) {
    console.error("Error updating pending transactions:", error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui status transaksi: ' + error.message
    });
  }
};

// Helper function untuk memproses langganan setelah pembayaran
async function processSubscription(transaction) {
  const dbTransaction = await db.sequelize.transaction();
  
  try {
    const userId = transaction.user_id;
    let planId, durationDays;
    
    // Ambil data plan
    let plan;
    if (transaction.plan) {
      plan = transaction.plan;
    } else {
      plan = await SubscriptionPlan.findByPk(transaction.plan_id, { transaction: dbTransaction });
    }
    
    if (!plan) {
      await dbTransaction.rollback();
      return { success: false, message: 'Plan tidak ditemukan' };
    }
    
    durationDays = plan.duration_days;
    
    // Cek langganan aktif
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
    
    if (activeSubscription) {
      // Perpanjang langganan yang ada
      const currentEndDate = new Date(activeSubscription.end_date);
      const newEndDate = new Date(currentEndDate);
      newEndDate.setDate(currentEndDate.getDate() + durationDays);
      
      await activeSubscription.update({
        end_date: newEndDate,
        payment_status: 'paid',
        payment_method: transaction.payment_method,
        tripay_reference: transaction.reference,
        tripay_merchant_ref: transaction.merchant_ref,
        transaction_id: transaction.id
      }, { transaction: dbTransaction });
      
      await dbTransaction.commit();
      
      return {
        success: true,
        action: 'extended',
        subscription_id: activeSubscription.id,
        end_date: newEndDate
      };
    } else {
      // Buat langganan baru
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + durationDays);
      
      const newSubscription = await Subscription.create({
        user_id: userId,
        start_date: startDate,
        end_date: endDate,
        status: 'active',
        payment_status: 'paid',
        payment_method: transaction.payment_method,
        tripay_reference: transaction.reference,
        tripay_merchant_ref: transaction.merchant_ref,
        transaction_id: transaction.id
      }, { transaction: dbTransaction });
      
      await dbTransaction.commit();
      
      return {
        success: true,
        action: 'created',
        subscription_id: newSubscription.id,
        end_date: endDate
      };
    }
  } catch (error) {
    await dbTransaction.rollback();
    console.error("Error processing subscription:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

exports.getCallbackLogs = async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak'
      });
    }
    
    // Cek apakah ada file log callback
    const fs = require('fs');
    const path = require('path');
    
    const logPath = path.join(__dirname, '../logs/callback.log');
    
    if (!fs.existsSync(logPath)) {
      return res.json({
        success: true,
        logs: [],
        message: 'Tidak ada log callback tersedia'
      });
    }
    
    // Baca log terakhir (max 100 baris)
    const log = fs.readFileSync(logPath, 'utf8');
    const lines = log.split('\n').filter(line => line.trim()).slice(-100);
    
    return res.json({
      success: true,
      logs: lines
    });
  } catch (error) {
    console.error("Error getting callback logs:", error);
    return res.status(500).json({
      success: false,
      message: 'Error mengambil log callback: ' + error.message
    });
  }
};

exports.debugTransaction = async (req, res) => {
  try {
    const { reference } = req.params;
    
    // Ambil detail transaksi dari database
    const transaction = await Transaction.findOne({
      where: { reference },
      include: [
        {
          model: SubscriptionPlan,
          as: 'plan',
          attributes: ['id', 'name', 'duration_days', 'price']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        },
        {
          model: Subscription,
          as: 'subscription',
          required: false
        }
      ]
    });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan'
      });
    }
    
    // Periksa langganan terkait
    const subscriptions = await Subscription.findAll({
      where: { 
        [db.Sequelize.Op.or]: [
          { tripay_reference: reference },
          { transaction_id: transaction.id }
        ]
      }
    });
    
    // Periksa status di Tripay
    let tripayStatus = null;
    try {
      const tripayAxios = getTripayAxios();
      const tripayResponse = await tripayAxios.get(`/transaction/detail?reference=${reference}`);
      tripayStatus = tripayResponse.data.data;
    } catch (tripayError) {
      console.error(`Error fetching Tripay status:`, tripayError);
    }
    
    return res.json({
      success: true,
      transaction: {
        id: transaction.id,
        reference: transaction.reference,
        merchant_ref: transaction.merchant_ref,
        user_id: transaction.user_id,
        plan_id: transaction.plan_id,
        payment_method: transaction.payment_method,
        status: transaction.status,
        amount: parseFloat(transaction.amount),
        total_amount: parseFloat(transaction.total_amount),
        created_at: transaction.created_at,
        paid_at: transaction.paid_at,
        expired_at: transaction.expired_at
      },
      linked_subscriptions: subscriptions.map(sub => ({
        id: sub.id,
        user_id: sub.user_id,
        start_date: sub.start_date,
        end_date: sub.end_date,
        status: sub.status,
        payment_status: sub.payment_status
      })),
      tripay_status: tripayStatus,
      plan_info: transaction.plan ? {
        id: transaction.plan.id,
        name: transaction.plan.name,
        duration_days: transaction.plan.duration_days,
        price: transaction.plan.price
      } : null,
      user_info: transaction.user ? {
        id: transaction.user.id,
        username: transaction.user.username,
        email: transaction.user.email
      } : null
    });
  } catch (error) {
    console.error("Error debugging transaction:", error);
    return res.status(500).json({
      success: false,
      message: 'Error debugging transaction: ' + error.message
    });
  }
};

exports.simulateCallback = async (req, res) => {
  try {
    const { reference } = req.params;
    
    // Cari transaksi di database
    const transaction = await Transaction.findOne({ 
      where: { reference },
      include: [{
        model: SubscriptionPlan,
        as: 'plan',
        required: false
      }]
    });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    // Simulasi callback dengan status PAID
    const callbackData = {
      reference: transaction.reference,
      merchant_ref: transaction.merchant_ref,
      payment_method: transaction.payment_method,
      payment_method_code: transaction.payment_method,
      total_amount: parseFloat(transaction.total_amount),
      fee_merchant: 0,
      fee_customer: parseFloat(transaction.fee || 0),
      total_fee: parseFloat(transaction.fee || 0),
      amount_received: parseFloat(transaction.amount),
      is_closed_payment: 1,
      status: "PAID",
      paid_at: new Date().toISOString(),
      note: "Simulated payment"
    };
    
    console.log("Simulating callback with data:", JSON.stringify(callbackData, null, 2));
    
    // Mulai transaction database
    const dbTransaction = await db.sequelize.transaction();
    
    try {
      // Perbarui status transaksi
      transaction.status = 'PAID';
      transaction.paid_at = new Date();
      await transaction.save({ transaction: dbTransaction });
      
      // Proses langganan
      const userId = transaction.user_id;
      let durationDays;
      
      if (transaction.plan) {
        durationDays = transaction.plan.duration_days;
      } else {
        const plan = await SubscriptionPlan.findByPk(transaction.plan_id);
        if (!plan) {
          throw new Error(`Plan with ID ${transaction.plan_id} not found`);
        }
        durationDays = plan.duration_days;
      }
      
      // Cek langganan aktif
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
      
      let subscriptionResult;
      
      if (activeSubscription) {
        // Perpanjang langganan yang ada
        const currentEndDate = new Date(activeSubscription.end_date);
        const newEndDate = new Date(currentEndDate);
        newEndDate.setDate(currentEndDate.getDate() + durationDays);
        
        await activeSubscription.update({
          end_date: newEndDate,
          payment_status: 'paid',
          payment_method: transaction.payment_method,
          tripay_reference: reference,
          tripay_merchant_ref: transaction.merchant_ref,
          transaction_id: transaction.id
        }, { transaction: dbTransaction });
        
        subscriptionResult = {
          action: 'extended',
          subscription_id: activeSubscription.id,
          end_date: newEndDate
        };
      } else {
        // Buat langganan baru
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + durationDays);
        
        const newSubscription = await Subscription.create({
          user_id: userId,
          start_date: startDate,
          end_date: endDate,
          status: 'active',
          payment_status: 'paid',
          payment_method: transaction.payment_method,
          tripay_reference: reference,
          tripay_merchant_ref: transaction.merchant_ref,
          transaction_id: transaction.id
        }, { transaction: dbTransaction });
        
        subscriptionResult = {
          action: 'created',
          subscription_id: newSubscription.id,
          end_date: endDate
        };
      }
      
      // Commit transaction
      await dbTransaction.commit();
      
      return res.json({
        success: true,
        message: 'Callback simulated successfully',
        transaction: {
          reference: transaction.reference,
          status: 'PAID',
          paid_at: transaction.paid_at
        },
        subscription: subscriptionResult
      });
    } catch (error) {
      await dbTransaction.rollback();
      console.error("Error processing simulated callback:", error);
      return res.status(500).json({
        success: false,
        message: 'Error processing simulated callback: ' + error.message
      });
    }
  } catch (error) {
    console.error("Error simulating callback:", error);
    return res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

module.exports = exports;