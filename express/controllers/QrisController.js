// controllers/QrisController.js
const { Subscription, SubscriptionPlan, User, QrisPayment, db } = require("../models");
const fs = require('fs');
const path = require('path');
const { generateRandomString } = require('../utils/helpers');
const moment = require('moment');

// Mendapatkan semua pembayaran QRIS tertunda untuk user
const getPendingPayments = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Tambahkan logging untuk debugging
    console.log('Mengambil pembayaran tertunda untuk user:', userId);
    
    // Gunakan raw query untuk menghindari masalah dengan relasi model
    const pendingPayments = await db.sequelize.query(
      `SELECT * FROM qris_payments 
       WHERE user_id = ? 
       AND status IN ('pending', 'waiting_verification')
       AND expired_at > NOW()
       ORDER BY created_at DESC
       LIMIT 3`,
      { 
        replacements: [userId],
        type: db.sequelize.QueryTypes.SELECT
      }
    );
    
    console.log(`Berhasil mengambil ${pendingPayments.length} pembayaran tertunda`);
    
    return res.status(200).json(pendingPayments);
  } catch (error) {
    console.error("Error getting pending payments:", error);
    
    // Return empty array untuk menghindari error di frontend
    return res.status(200).json([]);
  }
};

// Mendapatkan semua pembayaran QRIS tertunda untuk admin
const getPendingPaymentsAdmin = async (req, res) => {
  try {
    // Verifikasi admin
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }
    
    // Tambahkan logging untuk debugging
    console.log('Mengambil pending payments untuk admin...');
    
    // Ambil semua pembayaran tertunda dengan pengecualian error
    const pendingPayments = await db.sequelize.query(
      `SELECT qp.*, u.username, u.email 
       FROM qris_payments qp
       LEFT JOIN Users u ON qp.user_id = u.id
       WHERE qp.status IN ('pending', 'waiting_verification')
       AND qp.expired_at > NOW()
       ORDER BY qp.created_at DESC`,
      { 
        type: db.sequelize.QueryTypes.SELECT 
      }
    );
    
    console.log(`Menemukan ${pendingPayments.length} pembayaran tertunda`);
    
    // Format response dengan username dan email
    const formattedPayments = pendingPayments.map(payment => {
      return {
        ...payment,
        username: payment.username || 'Unknown',
        email: payment.email || 'Unknown'
      };
    });
    
    return res.status(200).json(formattedPayments);
  } catch (error) {
    console.error('Error mengambil pembayaran tertunda untuk admin:', error);
    return res.status(500).json({ 
      error: "Terjadi kesalahan pada server",
      message: error.message || "Unknown error"
    });
  }
};

// Mendapatkan riwayat pembayaran QRIS untuk user
const getPaymentHistory = async (req, res) => {
  try {
    // Tambahkan log untuk debugging
    console.log('Mencoba mengambil riwayat pembayaran untuk user:', req.userId);
    
    const userId = req.userId;
    
    // Gunakan raw query untuk menghindari masalah dengan relasi model
    const paymentHistory = await db.sequelize.query(
      `SELECT * FROM qris_payments WHERE user_id = ? ORDER BY created_at DESC`,
      { 
        replacements: [userId],
        type: db.sequelize.QueryTypes.SELECT
      }
    );
    
    console.log(`Berhasil mengambil ${paymentHistory.length} riwayat pembayaran`);
    
    return res.status(200).json(paymentHistory);
  } catch (error) {
    console.error('Error mengambil riwayat pembayaran:', error);
    return res.status(500).json({ 
      error: "Terjadi kesalahan pada server",
      message: error.message || "Unknown error"
    });
  }
};

// Mendapatkan riwayat pembayaran QRIS untuk admin
const getPaymentHistoryAdmin = async (req, res) => {
  try {
    // Verifikasi admin
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }
    
    // Parse filter parameters
    const { startDate, endDate, status, keyword } = req.query;
    
    // Bangun query SQL dengan filter
    let query = `
      SELECT qp.*, u.username, u.email 
      FROM qris_payments qp
      LEFT JOIN Users u ON qp.user_id = u.id
      WHERE 1=1
    `;
    
    const replacements = {};
    
    // Filter by date range
    if (startDate && endDate) {
      query += ` AND qp.created_at BETWEEN :startDate AND :endDate`;
      replacements.startDate = new Date(startDate);
      replacements.endDate = new Date(endDate);
      // Tambahkan 1 hari ke endDate untuk mendapatkan akhir hari
      replacements.endDate.setDate(replacements.endDate.getDate() + 1);
    }
    
    // Filter by status
    if (status) {
      query += ` AND qp.status = :status`;
      replacements.status = status;
    }
    
    // Filter by keyword (order_number atau username)
    if (keyword) {
      query += ` AND (qp.order_number LIKE :keyword OR u.username LIKE :keyword OR u.email LIKE :keyword)`;
      replacements.keyword = `%${keyword}%`;
    }
    
    // Tambahkan ordering
    query += ` ORDER BY qp.created_at DESC`;
    
    // Execute query
    const paymentHistory = await db.sequelize.query(
      query,
      { 
        replacements,
        type: db.sequelize.QueryTypes.SELECT 
      }
    );
    
    // Format response dengan username dan email
    const formattedHistory = paymentHistory.map(payment => {
      return {
        ...payment,
        username: payment.username || 'Unknown',
        email: payment.email || 'Unknown'
      };
    });
    
    return res.status(200).json(formattedHistory);
  } catch (error) {
    console.error('Error mengambil riwayat pembayaran untuk admin:', error);
    return res.status(500).json({ 
      error: "Terjadi kesalahan pada server",
      message: error.message || "Unknown error" 
    });
  }
};

// Membuat pembayaran QRIS baru
const createPayment = async (req, res) => {
  try {
    // Tambahkan debug log
    console.log('Mencoba membuat pembayaran QRIS baru dengan data:', req.body);
    
    const { plan_id, user_id, amount } = req.body;
    
    // Validasi input
    if (!plan_id || !user_id) {
      return res.status(400).json({ error: "Plan ID dan User ID harus diisi" });
    }
    
    // Ambil data user
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }
    
    // Ambil data paket langganan
    const plan = await SubscriptionPlan.findByPk(plan_id);
    if (!plan) {
      return res.status(404).json({ error: "Paket langganan tidak ditemukan" });
    }
    
    // Ambil pengaturan expiry
    const qrisSettings = await db.QrisSettings.findOne({
      order: [['id', 'DESC']]
    });
    
    const expiryHours = qrisSettings ? qrisSettings.expiry_hours : 1;
    
    // Generate order number
    const orderNumber = "QRIS" + Date.now().toString().slice(-8) + Math.random().toString(36).substring(2, 6).toUpperCase();
    
    // Tambahkan 3 digit unik ke jumlah pembayaran
    const uniqueDigits = Math.floor(Math.random() * 1000);
    const finalAmount = amount ? parseFloat(amount) + uniqueDigits : parseFloat(plan.price) + uniqueDigits;
    
    // Hitung tanggal expired
    const expiredAt = new Date();
    expiredAt.setHours(expiredAt.getHours() + expiryHours);
    
    console.log('Mencoba membuat record QrisPayment dengan data:', {
      user_id,
      plan_id,
      order_number: orderNumber,
      amount: finalAmount,
      status: 'pending',
      expired_at: expiredAt,
      plan_name: plan.name
    });
    
    // Gunakan metode yang lebih aman - create langsung dengan query SQL
    const [newPaymentId] = await db.sequelize.query(
      `INSERT INTO qris_payments 
       (user_id, plan_id, order_number, amount, status, expired_at, plan_name, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      { 
        replacements: [
          user_id, 
          plan_id, 
          orderNumber, 
          finalAmount, 
          'pending', 
          expiredAt, 
          plan.name
        ],
        type: db.sequelize.QueryTypes.INSERT
      }
    );
    
    // Ambil data pembayaran yang baru saja dibuat
    const [newPayment] = await db.sequelize.query(
      `SELECT * FROM qris_payments WHERE id = ?`,
      { 
        replacements: [newPaymentId],
        type: db.sequelize.QueryTypes.SELECT
      }
    );
    
    console.log('Pembayaran QRIS berhasil dibuat:', newPayment);
    
    return res.status(201).json({
      success: true,
      message: "Pembayaran berhasil dibuat",
      transaction: newPayment
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    return res.status(500).json({ 
      error: "Terjadi kesalahan pada server",
      message: error.message
    });
  }
};

// Konfirmasi pembayaran oleh user
const confirmPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    console.log('Processing payment confirmation for ID:', id, 'by user:', userId);
    
    // Cek dulu apakah ID valid
    if (!id) {
      return res.status(400).json({ error: "ID pembayaran tidak valid" });
    }
    
    // Gunakan query SQL langsung untuk menghindari masalah ORM
    try {
      const query = `
        UPDATE qris_payments 
        SET status = 'waiting_verification', updated_at = NOW() 
        WHERE id = ? AND user_id = ? AND status = 'pending'
      `;
      
      const result = await db.sequelize.query(
        query,
        {
          replacements: [id, userId],
          type: db.sequelize.QueryTypes.UPDATE
        }
      );
      
      console.log('Database update result:', result);
      
      // Jika tidak ada baris yang terpengaruh, berarti tidak ada pembayaran yang cocok
      if (result[1] === 0) {
        // Cek apakah pembayaran ada tapi user_id atau status tidak cocok
        const checkQuery = `SELECT id, user_id, status FROM qris_payments WHERE id = ?`;
        const payment = await db.sequelize.query(
          checkQuery,
          {
            replacements: [id],
            type: db.sequelize.QueryTypes.SELECT
          }
        );
        
        if (payment.length === 0) {
          return res.status(404).json({ error: "Pembayaran tidak ditemukan" });
        } else if (payment[0].user_id !== userId) {
          return res.status(403).json({ error: "Tidak memiliki izin" });
        } else if (payment[0].status !== 'pending') {
          return res.status(400).json({ error: "Pembayaran tidak dalam status menunggu" });
        } else {
          return res.status(500).json({ error: "Gagal memperbarui status pembayaran" });
        }
      }
      
      // Berhasil
      return res.status(200).json({
        success: true,
        message: "Konfirmasi pembayaran berhasil dikirim"
      });
      
    } catch (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ 
        error: "Terjadi kesalahan database",
        details: dbError.message
      });
    }
    
  } catch (error) {
    console.error('Error in confirmPayment:', error);
    return res.status(500).json({ 
      error: "Terjadi kesalahan pada server"
    });
  }
};

// Verifikasi pembayaran oleh admin
const verifyPayment = async (req, res) => {
  try {
    console.log("=== VERIFY PAYMENT REQUEST ===");
    console.log("Payment ID:", req.params.id);
    
    const { id } = req.params;
    
    // Verifikasi admin
    if (req.userRole !== "admin" && req.userId !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }
    
    // Gunakan query SQL langsung untuk update
    try {
      const query = `
        UPDATE qris_payments 
        SET status = 'verified', verified_at = NOW(), updated_at = NOW() 
        WHERE id = ?
      `;
      
      const result = await db.sequelize.query(query, {
        replacements: [id],
        type: db.sequelize.QueryTypes.UPDATE
      });
      
      console.log("Verification DB result:", result);
      
      // Proses langganan jika update berhasil
      // Ambil data pembayaran
      const paymentQuery = `SELECT * FROM qris_payments WHERE id = ?`;
      const payments = await db.sequelize.query(paymentQuery, {
        replacements: [id],
        type: db.sequelize.QueryTypes.SELECT
      });
      
      if (payments.length > 0) {
        const payment = payments[0];
        
        // Cek apakah user sudah memiliki langganan aktif
        const activeSubscription = await Subscription.findOne({
          where: {
            user_id: payment.user_id,
            status: "active",
            end_date: {
              [db.Sequelize.Op.gt]: new Date()
            }
          }
        });
        
        // Ambil data plan
        const plan = await SubscriptionPlan.findByPk(payment.plan_id);
        
        if (plan) {
          if (activeSubscription) {
            // Perpanjang langganan yang ada
            const newEndDate = new Date(activeSubscription.end_date);
            newEndDate.setDate(newEndDate.getDate() + plan.duration_days);
            
            await activeSubscription.update({
              end_date: newEndDate,
              payment_status: "paid",
              payment_method: "QRIS"
            });
          } else {
            // Buat langganan baru
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + plan.duration_days);
            
            await Subscription.create({
              user_id: payment.user_id,
              start_date: startDate,
              end_date: endDate,
              status: "active",
              payment_status: "paid",
              payment_method: "QRIS"
            });
          }
        }
      }
      
      return res.status(200).json({
        success: true,
        message: "Pembayaran berhasil diverifikasi"
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return res.status(500).json({ 
        error: "Terjadi kesalahan database",
        details: dbError.message
      });
    }
  } catch (error) {
    console.error("=== VERIFY PAYMENT ERROR ===", error);
    return res.status(500).json({ 
      error: "Terjadi kesalahan pada server",
      details: error.message
    });
  }
};

// Tolak pembayaran oleh admin
const rejectPayment = async (req, res) => {
  try {
    console.log("=== REJECT PAYMENT REQUEST ===");
    console.log("Payment ID:", req.params.id);
    
    const { id } = req.params;
    
    // Verifikasi admin
    if (req.userRole !== "admin" && req.userId !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }
    
    // Gunakan query SQL langsung untuk update
    try {
      const query = `
        UPDATE qris_payments 
        SET status = 'rejected', rejected_at = NOW(), updated_at = NOW() 
        WHERE id = ?
      `;
      
      const result = await db.sequelize.query(query, {
        replacements: [id],
        type: db.sequelize.QueryTypes.UPDATE
      });
      
      console.log("Rejection DB result:", result);
      
      return res.status(200).json({
        success: true,
        message: "Pembayaran berhasil ditolak"
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return res.status(500).json({ 
        error: "Terjadi kesalahan database",
        details: dbError.message
      });
    }
  } catch (error) {
    console.error("=== REJECT PAYMENT ERROR ===", error);
    return res.status(500).json({ 
      error: "Terjadi kesalahan pada server",
      details: error.message
    });
  }
};

// Cek status pembayaran
const checkPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    console.log("CheckPaymentStatus called with ID:", id, "by user:", userId);

    if (!id) {
      return res.status(400).json({ success: false, message: "ID pembayaran tidak valid" });
    }

    // Ambil data pembayaran
    const payment = await db.QrisPayment.findByPk(id); // ✅ gunakan db.QrisPayment

    if (!payment) {
      return res.status(404).json({ success: false, message: "Pembayaran tidak ditemukan" });
    }

    // Verifikasi kepemilikan (kecuali admin)
    if (payment.user_id !== userId && req.userRole !== "admin") {
      return res.status(403).json({ success: false, message: "Tidak memiliki izin" });
    }

    return res.status(200).json({
      success: true,
      id: payment.id,
      order_number: payment.order_number,
      status: payment.status,
      amount: payment.amount,
      plan_name: payment.plan_name,
      expired_at: payment.expired_at,
      verified_at: payment.verified_at,
      rejected_at: payment.rejected_at
    });
  } catch (error) {
    console.error("Error checking payment status:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Mendapatkan gambar QRIS
const getQrisImage = async (req, res) => {
  try {
    console.log('Mengambil gambar QRIS...');
    
    // Ambil pengaturan QRIS
    const qrisSettings = await db.QrisSettings.findOne({
      order: [['id', 'DESC']]
    });
    
    // Dapatkan base URL dari konfigurasi atau request
    const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
    
    if (qrisSettings && qrisSettings.qris_image) {
      const imageUrl = qrisSettings.qris_image.startsWith('http') 
        ? qrisSettings.qris_image 
        : `${baseUrl}${qrisSettings.qris_image}`;
      
      console.log('Gambar QRIS ditemukan:', imageUrl);
      // Tambahkan logging
      console.log('Full QRIS image URL:', baseUrl + qrisSettings.qris_image);
      
      return res.status(200).json({
        success: true,
        imageUrl: imageUrl
      });
    } else {
      // URL lengkap untuk gambar default
      const defaultImageUrl = `${baseUrl}/default-qris.png`;
      console.log('Gambar QRIS tidak ditemukan, menggunakan gambar default:', defaultImageUrl);
      return res.status(200).json({
        success: true,
        imageUrl: defaultImageUrl,
        isDefault: true
      });
    }
  } catch (error) {
    console.error("Error getting QRIS image:", error);
    // URL lengkap untuk gambar default
    const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
    const defaultImageUrl = `${baseUrl}/default-qris.png`;
    
    return res.status(200).json({ 
      success: true,
      imageUrl: defaultImageUrl,
      isDefault: true,
      message: "Menggunakan gambar default karena terjadi error"
    });
  }
};

// Menyimpan pengaturan QRIS
const saveQrisSettings = async (req, res) => {
  try {
    // Verifikasi admin
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }
    
    const { expiryHours } = req.body;
    
    // Validasi input
    if (!expiryHours || expiryHours < 1 || expiryHours > 48) {
      return res.status(400).json({ error: "Waktu kedaluwarsa harus antara 1-48 jam" });
    }
    
    // Ambil pengaturan yang ada
    let qrisSettings = await db.QrisSettings.findOne({
      order: [['id', 'DESC']]
    });
    
    if (qrisSettings) {
      // Update pengaturan yang ada
      await qrisSettings.update({
        expiry_hours: expiryHours
      });
    } else {
      // Buat pengaturan baru
      qrisSettings = await db.QrisSettings.create({
        expiry_hours: expiryHours,
        qris_image: null
      });
    }
    
    return res.status(200).json({
      success: true,
      message: "Pengaturan QRIS berhasil disimpan"
    });
  } catch (error) {
    console.error("Error saving QRIS settings:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

// Upload gambar QRIS
const uploadQrisImage = async (req, res) => {
  try {
    // Verifikasi admin
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }
    
    // Cek apakah ada file atau data base64
    if (!req.file && !req.body.qrisImageBase64) {
      return res.status(400).json({ error: "File gambar tidak ditemukan" });
    }
    
    let imageBuffer;
    let fileExt = '.png';
    
    if (req.file) {
      // Jika upload file biasa
      imageBuffer = req.file.buffer;
      fileExt = path.extname(req.file.originalname) || '.png';
    } else if (req.body.qrisImageBase64) {
      // Jika upload base64
      const base64Data = req.body.qrisImageBase64.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
      
      // Deteksi ekstensi dari data base64
      if (req.body.qrisImageBase64.startsWith('data:image/jpeg')) {
        fileExt = '.jpg';
      } else if (req.body.qrisImageBase64.startsWith('data:image/png')) {
        fileExt = '.png';
      }
    }
    
    // Simpan file ke direktori uploads
    const filename = `qris_${Date.now()}${fileExt}`;
    const filepath = path.join(__dirname, '../public/uploads', filename);
    
    // Pastikan direktori uploads ada
    const uploadsDir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    fs.writeFileSync(filepath, imageBuffer);
    
    // Buat URL untuk gambar
    const imageUrl = `/uploads/${filename}`;
    
    // Ambil pengaturan yang ada
    let qrisSettings = await db.QrisSettings.findOne({
      order: [['id', 'DESC']]
    });
    
    if (qrisSettings) {
      // Update pengaturan yang ada
      await qrisSettings.update({
        qris_image: imageUrl
      });
    } else {
      // Buat pengaturan baru
      qrisSettings = await db.QrisSettings.create({
        expiry_hours: 1,
        qris_image: imageUrl
      });
    }
    
    return res.status(200).json({
      success: true,
      message: "Gambar QRIS berhasil diunggah",
      imageUrl
    });
  } catch (error) {
    console.error("Error uploading QRIS image:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

// Tambahkan fungsi uploadQrisImageBase64
const uploadQrisImageBase64 = async (req, res) => {
  try {
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }
    
    if (!req.body.qrisImageBase64) {
      return res.status(400).json({ error: "Data gambar base64 tidak ditemukan" });
    }
    
    const base64Data = req.body.qrisImageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Deteksi ekstensi dari data base64
    let fileExt = '.png';
    if (req.body.qrisImageBase64.startsWith('data:image/jpeg')) {
      fileExt = '.jpg';
    }
    
    const filename = `qris_${Date.now()}${fileExt}`;
    
    // Pastikan direktori uploads ada
    const uploadsDir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, imageBuffer);
    
    const imageUrl = `/uploads/${filename}`;
    
    let qrisSettings = await db.QrisSettings.findOne({
      order: [['id', 'DESC']]
    });
    
    if (qrisSettings) {
      await qrisSettings.update({ qris_image: imageUrl });
    } else {
      qrisSettings = await db.QrisSettings.create({
        expiry_hours: 1,
        qris_image: imageUrl
      });
    }
    
    return res.status(200).json({
      success: true,
      message: "Gambar QRIS berhasil diunggah",
      imageUrl
    });
  } catch (error) {
    console.error("Error uploading QRIS image:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

// Mendapatkan pengaturan QRIS
const getQrisSettings = async (req, res) => {
  try {
    // Verifikasi admin
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }
    
    // Ambil pengaturan QRIS
    const qrisSettings = await db.QrisSettings.findOne({
      order: [['id', 'DESC']]
    });
    
    if (qrisSettings) {
      return res.status(200).json({
        expiryHours: qrisSettings.expiry_hours,
        qrisImage: qrisSettings.qris_image
      });
    } else {
      return res.status(200).json({
        expiryHours: 1,
        qrisImage: null
      });
    }
  } catch (error) {
    console.error("Error getting QRIS settings:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

// Helper function to send WhatsApp notification
const sendWhatsAppNotification = async (payment) => {
  try {
    console.log("Memulai proses notifikasi WhatsApp untuk payment ID:", payment.id);
    
    // Ambil data user
    const user = await User.findByPk(payment.user_id);
    if (!user) {
      console.error("User not found for WhatsApp notification, user_id:", payment.user_id);
      return;
    }
    
    // Ambil data paket
    let plan = null;
    try {
      plan = await SubscriptionPlan.findByPk(payment.plan_id);
    } catch (planError) {
      console.error("Error fetching plan:", planError);
      // Lanjutkan meskipun gagal mengambil plan
    }
    
    // Ambil pengaturan WhatsApp
    let whatsappSettings = null;
    try {
      whatsappSettings = await db.BaileysSettings.findOne({
        order: [['id', 'DESC']]
      });
    } catch (settingsError) {
      console.error("Error fetching WhatsApp settings:", settingsError);
      return; // Hentikan jika tidak bisa mendapatkan pengaturan
    }
    
    if (!whatsappSettings || !whatsappSettings.notification_enabled) {
      console.log("WhatsApp notifications are disabled");
      return;
    }
    
    // Format pesan notifikasi
    let message = whatsappSettings.template_message;
    message = message
      .replace(/{username}/g, user.username || 'Unknown')
      .replace(/{email}/g, user.email || 'Unknown')
      .replace(/{amount}/g, payment.amount ? payment.amount.toLocaleString('id-ID') : '0')
      .replace(/{plan_name}/g, plan ? plan.name : 'Paket Langganan')
      .replace(/{order_number}/g, payment.order_number || 'Unknown');
    
    console.log("Pesan notifikasi diformat:", message);
    
    // Kirim notifikasi ke WhatsApp grup
    if (global.waConnection && global.waConnection.isConnected) {
      try {
        await global.waConnection.sendGroupMessage(
          whatsappSettings.group_name,
          message
        );
        
        // Log notification
        await db.BaileysLog.create({
          type: 'notification',
          status: 'success',
          message: `Notifikasi pembayaran #${payment.order_number} berhasil dikirim`,
          data: {
            payment_id: payment.id,
            order_number: payment.order_number,
            user_id: payment.user_id,
            username: user.username
          }
        });
        
        console.log(`WhatsApp notification sent for payment #${payment.order_number}`);
      } catch (sendError) {
        console.error("Error sending group message:", sendError);
        throw sendError; // Re-throw untuk penanganan di level atas
      }
    } else {
      console.error("WhatsApp is not connected");
      
      // Log error
      try {
        await db.BaileysLog.create({
          type: 'notification',
          status: 'failed',
          message: `Gagal mengirim notifikasi pembayaran #${payment.order_number} - WhatsApp tidak terhubung`,
          data: {
            payment_id: payment.id,
            order_number: payment.order_number
          }
        });
      } catch (logError) {
        console.error("Error creating log entry:", logError);
      }
    }
  } catch (error) {
    console.error("Error sending WhatsApp notification:", error);
    
    // Log error
    try {
      await db.BaileysLog.create({
        type: 'notification',
        status: 'failed',
        message: `Error saat mengirim notifikasi pembayaran #${payment.order_number}: ${error.message}`,
        data: {
          payment_id: payment.id,
          order_number: payment.order_number,
          error: error.message
        }
      });
    } catch (logError) {
      console.error("Error creating log entry:", logError);
    }
  }
};

module.exports = {
  getPendingPayments,
  getPendingPaymentsAdmin,
  getPaymentHistory,
  getPaymentHistoryAdmin,
  createPayment,
  confirmPayment,
  verifyPayment,
  rejectPayment,
  checkPaymentStatus,
  getQrisImage,
  saveQrisSettings,
  uploadQrisImage,
  uploadQrisImageBase64,
  getQrisSettings
};