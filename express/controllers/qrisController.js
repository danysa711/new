// express/controllers/qrisController.js
// Perbaikan untuk qrisController.js

const { 
  QrisSettings, 
  QrisPayment, 
  SubscriptionPlan, 
  User, 
  Subscription,
  WhatsAppGroupSettings,
  db 
} = require("../models");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

// Pastikan direktori uploads ada
const ensureUploadsDir = () => {
  const uploadDir = path.join(__dirname, '../uploads/payment_proof');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

// Integrasi dengan WhatsApp API
const sendWhatsAppNotification = async (qrisPayment) => {
  try {
    // Dapatkan pengaturan grup WhatsApp
    const groupSettings = await WhatsAppGroupSettings.findOne({
      where: { is_active: true }
    });
    
    if (!groupSettings) {
      console.error("Pengaturan grup WhatsApp tidak ditemukan");
      return false;
    }
    
    // Dapatkan data user dan plan
    const user = await User.findByPk(qrisPayment.user_id);
    const plan = await SubscriptionPlan.findByPk(qrisPayment.plan_id);
    
    if (!user || !plan) {
      console.error("User atau plan tidak ditemukan");
      return false;
    }
    
    // Format pesan
    let message = groupSettings.notification_template;
    message = message.replace("{username}", user.username);
    message = message.replace("{plan_name}", plan.name);
    message = message.replace("{amount}", qrisPayment.total_amount);
    message = message.replace("{reference}", qrisPayment.reference);
    
    // Kirim ke WhatsApp menggunakan Baileys client
    const baileysClient = require('../utils/baileys/baileys-client');
    
    // Coba inisialisasi client jika belum
    if (!baileysClient.isReady()) {
      await baileysClient.initSocket();
      // Tunggu 3 detik untuk inisialisasi
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    if (baileysClient.isReady()) {
      // Jika ada group_id, kirim ke grup
      if (groupSettings.group_id) {
        const sent = await baileysClient.sendGroupMessage(
          groupSettings.group_id,
          message
        );
        
        if (sent) {
          // Update status notifikasi
          await qrisPayment.update({ 
            whatsapp_notification_sent: true,
            whatsapp_verification: 'PENDING'
          });
          return true;
        }
      } else {
        // Cari admin dengan WhatsApp terhubung
        const admin = await User.findOne({
          where: {
            role: 'admin',
            whatsapp_connected: true
          }
        });
        
        if (admin && admin.whatsapp_number) {
          const sent = await baileysClient.sendMessage(
            admin.whatsapp_number,
            message
          );
          
          if (sent) {
            // Update status notifikasi
            await qrisPayment.update({ 
              whatsapp_notification_sent: true,
              whatsapp_verification: 'PENDING'
            });
            return true;
          }
        }
      }
    }
    
    console.log("Baileys client belum siap atau pesan tidak terkirim");
    return false;
  } catch (error) {
    console.error("Error dalam sendWhatsAppNotification:", error);
    return false;
  }
};

// Mendapatkan pengaturan QRIS
const getQrisSettings = async (req, res) => {
  try {
    console.log("Getting QRIS settings from URL:", req.originalUrl);
    console.log("Query params:", req.query);
    
    // Coba temukan pengaturan QRIS yang aktif
    let settings = null;
    
    try {
      settings = await QrisSettings.findOne({
        where: { is_active: true }
      });
      
      // Jika tidak ada yang aktif, cari yang pertama
      if (!settings) {
        settings = await QrisSettings.findOne();
      }
    } catch (dbError) {
      console.error("Database error when fetching QrisSettings:", dbError);
      // Lanjut untuk menggunakan data default
    }
    
    // Jika tidak ada pengaturan, gunakan default
    if (!settings) {
      console.log("No QRIS settings found, using default");
      
      // Coba buat default
      try {
        settings = await QrisSettings.create({
          merchant_name: "Kinterstore",
          qris_image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAFAAQMAAAD3XjfpAAAABlBMVEX///8AAABVwtN+AAABA0lEQVRo3u2YMQ7DIAxFDRk5Qo7AUTgaR+loOQJHYKSImVTNH8fUVSvBwJs88Gfwl2MwEHweHEIoiqIoiqIoitqkL+p5tgAC+Cx4GGNc/kdc5QcRgA/CgwhAACCAAAIIIIB/CwaRAJ8QLwq+QwgggADuBS8KAQQQQDAF9ABmtbqzn6DUa3Yy8ipdV6t76aYN26xFR76yKTbecw5xg7XT0PTLna5YeVGrZqDT/mllTfG6Wdr9KE+5c5p+0xt0w7afMOvQPFQHbqiPmJqTjnGnJmK4epEQ74KDOPNeCnXngJ2KAu4XAL5fWGIbk8jm1+sA4D+CeywAAAQQQAABBBBAAKdlDkO5qQMRbkZBAAAAAElFTkSuQmCC",
          is_active: true,
          expiry_hours: 24,
          instructions: "Scan kode QR menggunakan aplikasi e-wallet atau mobile banking Anda."
        });
      } catch (createError) {
        console.error("Error creating default QRIS settings:", createError);
        
        // Jika masih gagal, kirim data default saja
        return res.status(200).json({
          merchant_name: "Kinterstore",
          qris_image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAFAAQMAAAD3XjfpAAAABlBMVEX///8AAABVwtN+AAABA0lEQVRo3u2YMQ7DIAxFDRk5Qo7AUTgaR+loOQJHYKSImVTNH8fUVSvBwJs88Gfwl2MwEHweHEIoiqIoiqIoitqkL+p5tgAC+Cx4GGNc/kdc5QcRgA/CgwhAACCAAAIIIIB/CwaRAJ8QLwq+QwgggADuBS8KAQQQQDAF9ABmtbqzn6DUa3Yy8ipdV6t76aYN26xFR76yKTbecw5xg7XT0PTLna5YeVGrZqDT/mllTfG6Wdr9KE+5c5p+0xt0w7afMOvQPFQHbqiPmJqTjnGnJmK4epEQ74KDOPNeCnXngJ2KAu4XAL5fWGIbk8jm1+sA4D+CeywAAAQQQAABBBBAAKdlDkO5qQMRbkZBAAAAAElFTkSuQmCC",
          is_active: true,
          expiry_hours: 24,
          instructions: "Scan kode QR menggunakan aplikasi e-wallet atau mobile banking Anda."
        });
      }
    }
    
    // Tambahkan header untuk mencegah caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    return res.status(200).json(settings);
  } catch (error) {
    console.error("Error getting QRIS settings:", error);
    
    // Selalu mengembalikan data default jika terjadi error
    return res.status(200).json({
      merchant_name: "Kinterstore",
      qris_image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAFAAQMAAAD3XjfpAAAABlBMVEX///8AAABVwtN+AAABA0lEQVRo3u2YMQ7DIAxFDRk5Qo7AUTgaR+loOQJHYKSImVTNH8fUVSvBwJs88Gfwl2MwEHweHEIoiqIoiqIoitqkL+p5tgAC+Cx4GGNc/kdc5QcRgA/CgwhAACCAAAIIIIB/CwaRAJ8QLwq+QwgggADuBS8KAQQQQDAF9ABmtbqzn6DUa3Yy8ipdV6t76aYN26xFR76yKTbecw5xg7XT0PTLna5YeVGrZqDT/mllTfG6Wdr9KE+5c5p+0xt0w7afMOvQPFQHbqiPmJqTjnGnJmK4epEQ74KDOPNeCnXngJ2KAu4XAL5fWGIbk8jm1+sA4D+CeywAAAQQQAABBBBAAKdlDkO5qQMRbkZBAAAAAElFTkSuQmCC",
      is_active: true,
      expiry_hours: 24,
      instructions: "Scan kode QR menggunakan aplikasi e-wallet atau mobile banking Anda."
    });
  }
};

// Menyimpan pengaturan QRIS (admin)
const saveQrisSettings = async (req, res) => {
  try {
    const { merchant_name, qris_image, is_active, expiry_hours, instructions } = req.body;
    
    // Validasi input
    if (!merchant_name || !qris_image) {
      res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
      return res.status(400).json({ error: "Merchant name and QRIS image are required" });
    }
    
    // Cek apakah pengaturan sudah ada
    let settings = await QrisSettings.findOne();
    
    if (settings) {
      // Update pengaturan yang ada
      settings = await settings.update({
        merchant_name,
        qris_image,
        is_active: is_active !== undefined ? is_active : settings.is_active,
        expiry_hours: expiry_hours || settings.expiry_hours,
        instructions: instructions || settings.instructions
      });
    } else {
      // Buat pengaturan baru
      settings = await QrisSettings.create({
        merchant_name,
        qris_image,
        is_active: is_active !== undefined ? is_active : true,
        expiry_hours: expiry_hours || 24,
        instructions
      });
    }
    
    return res.status(200).json({
      message: "QRIS settings saved successfully",
      settings
    });
  } catch (error) {
    console.error("Error saving QRIS settings:", error);
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};

// Membuat transaksi QRIS baru
const createQrisPayment = async (req, res) => {
  try {
    const { plan_id } = req.body;
    const user_id = req.userId || req.body.user_id || req.query.user_id;

    if (!user_id) {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  return res.status(400).json({ error: "User ID is required" });
}

    console.log(`Uploading payment proof for reference: ${reference}, user: ${user_id}`);
    console.log(`Creating QRIS payment for user ${user_id}, plan ${plan_id}`);
    
    // Validasi input
    if (!plan_id) {
      res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
      return res.status(400).json({ error: "Plan ID is required" });
    }
    
    // Dapatkan paket langganan
    const plan = await SubscriptionPlan.findByPk(plan_id);
    if (!plan) {
      res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
      return res.status(404).json({ error: "Subscription plan not found" });
    }
    
    // Dapatkan pengaturan QRIS
    const qrisSettings = await QrisSettings.findOne({
      where: { is_active: true }
    });
    
    if (!qrisSettings) {
      console.log("QrisSettings tidak ditemukan, membuat default");
      const defaultSettings = await QrisSettings.create({
        merchant_name: "Kinterstore",
        qris_image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAFAAQMAAAD3XjfpAAAABlBMVEX///8AAABVwtN+AAABA0lEQVRo3u2YMQ7DIAxFDRk5Qo7AUTgaR+loOQJHYKSImVTNH8fUVSvBwJs88Gfwl2MwEHweHEIoiqIoiqIoitqkL+p5tgAC+Cx4GGNc/kdc5QcRgA/CgwhAACCAAAIIIIB/CwaRAJ8QLwq+QwgggADuBS8KAQQQQDAF9ABmtbqzn6DUa3Yy8ipdV6t76aYN26xFR76yKTbecw5xg7XT0PTLna5YeVGrZqDT/mllTfG6Wdr9KE+5c5p+0xt0w7afMOvQPFQHbqiPmJqTjnGnJmK4epEQ74KDOPNeCnXngJ2KAu4XAL5fWGIbk8jm1+sA4D+CeywAAAQQQAABBBBAAKdlDkO5qQMRbkZBAAAAAElFTkSuQmCC",
        is_active: true,
        expiry_hours: 24,
        instructions: "Scan kode QR menggunakan aplikasi e-wallet atau mobile banking Anda."
      });
      
      // Gunakan pengaturan yang baru dibuat
      return createQrisPayment(req, res);
    }
    
    // Buat kode unik untuk nominal pembayaran (3 digit terakhir)
    const unique_code = Math.floor(Math.random() * 900) + 100; // 100-999
    
    // Hitung total pembayaran
    const amount = parseFloat(plan.price);
    const total_amount = parseFloat((amount + (unique_code / 100)).toFixed(2)); // Tambahkan kode unik ke belakang
    
    // Buat referensi unik
    const reference = `QRIS-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    
    // Hitung tanggal kedaluwarsa
    const expired_at = new Date();
    expired_at.setHours(expired_at.getHours() + qrisSettings.expiry_hours);
    
    // PERBAIKAN: Pastikan amount adalah nilai yang valid dan bukan generated column
    // Buat transaksi baru
    
    const payment = await QrisPayment.create({
      user_id,
      plan_id,
      reference,
      amount,                // Simpan amount secara langsung
      unique_code,
      total_amount,
      expired_at,
      status: 'UNPAID'
    });
    
    console.log(`QRIS payment created with reference: ${reference}`);
    
    return res.status(201).json({
      success: true,
      message: "QRIS payment created successfully",
      payment: {
        ...payment.toJSON(),
        qris_image: qrisSettings.qris_image,
        merchant_name: qrisSettings.merchant_name,
        instructions: qrisSettings.instructions
      }
    });
  } catch (error) {
    console.error("Error creating QRIS payment:", error);
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};

// Upload bukti pembayaran QRIS
const uploadPaymentProof = async (req, res) => {
  try {
    const { reference } = req.params;
    const user_id = req.userId || req.body.user_id || req.query.user_id;
    
    console.log(`Uploading payment proof for reference: ${reference}`);
    
    // Cek apakah ada file yang diupload
    if (!req.file) {
      res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
      return res.status(400).json({ error: "Payment proof image is required" });
    }
    
    // Cari transaksi
    const payment = await QrisPayment.findOne({
      where: { reference, user_id }
    });
    
    if (!payment) {
      res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
      return res.status(404).json({ error: "Payment not found" });
    }
    
    if (payment.status !== "UNPAID") {
      res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
      return res.status(400).json({ error: "Payment has already been processed" });
    }
    
    // Pastikan direktori upload ada
    ensureUploadsDir();
    
    // Simpan bukti pembayaran (base64)
    const fileBuffer = fs.readFileSync(req.file.path);
    const base64Image = `data:${req.file.mimetype};base64,${fileBuffer.toString("base64")}`;
    
    // Update payment dengan bukti pembayaran
    await payment.update({
      payment_proof: base64Image
    });
    
    console.log(`Payment proof uploaded, sending WhatsApp notification`);
    
    // Kirim notifikasi WhatsApp
    try {
      sendWhatsAppNotification(payment).then(sent => {
        console.log(`WhatsApp notification ${sent ? 'sent' : 'failed'}`);
      });
    } catch (whatsappError) {
      console.error("Error sending WhatsApp notification:", whatsappError);
      // Lanjutkan meski notifikasi WhatsApp gagal
    }
    
    // Hapus file temporary
    try {
      fs.unlinkSync(req.file.path);
    } catch (unlinkError) {
      console.error("Error deleting temporary file:", unlinkError);
    }
    
    return res.status(200).json({
      success: true,
      message: "Payment proof uploaded successfully",
      payment: payment.toJSON()
    });
  } catch (error) {
    console.error("Error uploading payment proof:", error);
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};

// Mendapatkan riwayat pembayaran QRIS
const getUserQrisPayments = async (req, res) => {
  try {
    const user_id = req.userId || req.query.user_id; // ✅ ambil dari token atau query

    if (!user_id) {
      res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
      return res.status(400).json({ error: "Missing user_id parameter" }); // ✅ validasi
    }

    const payments = await QrisPayment.findAll({
      where: { user_id },
      include: [
        { model: User, attributes: ['username', 'email'] },
        { model: SubscriptionPlan, attributes: ['name', 'duration_days', 'price'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json(payments);
  } catch (error) {
    console.error("Error getting user QRIS payments:", error);
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};

// Mendapatkan semua pembayaran QRIS (admin)
const getAllQrisPayments = async (req, res) => {
  try {
    console.log(`Admin retrieving all QRIS payments`);
    
    const payments = await QrisPayment.findAll({
      include: [
        { model: User, attributes: ['username', 'email'] },
        { model: SubscriptionPlan, attributes: ['name', 'duration_days', 'price'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`Found ${payments.length} QRIS payments total`);
    
    return res.status(200).json(payments);
  } catch (error) {
    console.error("Error getting all QRIS payments:", error);
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};

// Verifikasi pembayaran QRIS (admin)
const verifyQrisPayment = async (req, res) => {
  try {
    const { reference } = req.params;
    const { status, verification_note } = req.body;
    
    console.log(`Verifying QRIS payment ${reference} with status: ${status}`);
    
    // Validasi input
    if (!status || !['VERIFIED', 'REJECTED'].includes(status)) {
      res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
      return res.status(400).json({ error: "Invalid status" });
    }
    
    // Cari transaksi
    const payment = await QrisPayment.findOne({
      where: { reference },
      include: [
        { model: User },
        { model: SubscriptionPlan }
      ]
    });
    
    if (!payment) {
      res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
      return res.status(404).json({ error: "Payment not found" });
    }
    
    if (payment.status !== "UNPAID") {
      res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
      return res.status(400).json({ error: "Payment has already been processed" });
    }
    
    // Update status verifikasi WhatsApp
    await payment.update({
      whatsapp_verification: status === 'VERIFIED' ? 'VERIFIED' : 'REJECTED',
      status: status === 'VERIFIED' ? 'PAID' : 'REJECTED'
    });
    
    console.log(`Payment ${reference} updated to ${status}`);
    
    // Jika terverifikasi, aktifkan langganan
    if (status === 'VERIFIED') {
      // Cek apakah sudah ada langganan aktif
      const activeSubscription = await Subscription.findOne({
        where: {
          user_id: payment.user_id,
          status: "active",
          end_date: {
            [db.Sequelize.Op.gt]: new Date()
          }
        }
      });
      
      const now = new Date();
      const endDate = new Date();
      
      if (activeSubscription) {
        // Jika sudah ada langganan aktif, perpanjang
        const newEndDate = new Date(activeSubscription.end_date);
        newEndDate.setDate(newEndDate.getDate() + payment.SubscriptionPlan.duration_days);
        
        await activeSubscription.update({
          end_date: newEndDate
        });
        
        console.log(`Extended subscription until ${newEndDate}`);
      } else {
        // Buat langganan baru
        endDate.setDate(now.getDate() + payment.SubscriptionPlan.duration_days);
        
        await Subscription.create({
          user_id: payment.user_id,
          start_date: now,
          end_date: endDate,
          status: "active",
          payment_status: "paid",
          payment_method: "QRIS Manual"
        });
        
        console.log(`Created new subscription until ${endDate}`);
      }
    }
    
    return res.status(200).json({
      success: true,
      message: `Payment ${status === 'VERIFIED' ? 'verified' : 'rejected'} successfully`,
      payment: payment.toJSON()
    });
  } catch (error) {
    console.error("Error verifying QRIS payment:", error);
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};

// Mendapatkan pengaturan grup WhatsApp
const getWhatsAppGroupSettings = async (req, res) => {
  try {
    console.log(`Getting WhatsApp group settings`);
    
    let settings = await WhatsAppGroupSettings.findOne();
    
    if (!settings) {
      // Create default settings
      settings = await WhatsAppGroupSettings.create({
        group_name: "Verifikasi Pembayaran",
        group_id: "",
        is_active: true,
        notification_template: "Cek status pembayaran username: {username} untuk paket {plan_name} dengan nominal Rp {amount}"
      });
      
      console.log(`Created default WhatsApp group settings`);
    }
    
    return res.status(200).json(settings);
  } catch (error) {
    console.error("Error getting WhatsApp group settings:", error);
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};

// Menyimpan pengaturan grup WhatsApp (admin)
const saveWhatsAppGroupSettings = async (req, res) => {
  try {
    const { group_name, group_id, is_active, notification_template } = req.body;
    
    console.log(`Saving WhatsApp group settings: ${group_name}`);
    
    // Validasi input
    if (!group_name) {
      res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
      return res.status(400).json({ error: "Group name is required" });
    }
    
    // Cek apakah pengaturan sudah ada
    let settings = await WhatsAppGroupSettings.findOne();
    
    if (settings) {
      // Update pengaturan yang ada
      settings = await settings.update({
        group_name,
        group_id: group_id || settings.group_id,
        is_active: is_active !== undefined ? is_active : settings.is_active,
        notification_template: notification_template || settings.notification_template
      });
    } else {
      // Buat pengaturan baru
      settings = await WhatsAppGroupSettings.create({
        group_name,
        group_id,
        is_active: is_active !== undefined ? is_active : true,
        notification_template: notification_template || "Cek status pembayaran username: {username} untuk paket {plan_name} dengan nominal Rp {amount}"
      });
    }
    
    console.log(`WhatsApp group settings saved successfully`);
    
    return res.status(200).json({
      success: true,
      message: "WhatsApp group settings saved successfully",
      settings
    });
  } catch (error) {
    console.error("Error saving WhatsApp group settings:", error);
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};

const uploadPaymentProofBase64 = async (req, res) => {
  try {
    const { reference } = req.params;
    const { payment_proof_base64, file_type } = req.body;
    const user_id = req.userId || req.body.user_id || req.query.user_id;
    
    console.log(`Uploading base64 payment proof for reference: ${reference}`);
    
    // Cek apakah ada data base64
    if (!payment_proof_base64) {
      res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
      return res.status(400).json({ error: "Payment proof data is required" });
    }
    
    // Cari transaksi
    const payment = await QrisPayment.findOne({
      where: { reference, user_id }
    });
    
    if (!payment) {
      res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
      return res.status(404).json({ error: "Payment not found" });
    }
    
    if (payment.status !== "UNPAID") {
      res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
      return res.status(400).json({ error: "Payment has already been processed" });
    }
    
    // Format data base64
    const contentType = file_type || 'image/jpeg';
    const base64Image = `data:${contentType};base64,${payment_proof_base64}`;
    
    // Update payment dengan bukti pembayaran
    await payment.update({
      payment_proof: base64Image
    });
    
    console.log(`Base64 payment proof uploaded, sending WhatsApp notification`);
    
    // Kirim notifikasi WhatsApp
    try {
      sendWhatsAppNotification(payment).then(sent => {
        console.log(`WhatsApp notification ${sent ? 'sent' : 'failed'}`);
      });
    } catch (whatsappError) {
      console.error("Error sending WhatsApp notification:", whatsappError);
      // Lanjutkan meski notifikasi WhatsApp gagal
    }
    
    return res.status(200).json({
      success: true,
      message: "Payment proof uploaded successfully",
      payment: payment.toJSON()
    });
  } catch (error) {
    console.error("Error uploading base64 payment proof:", error);
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};

const cancelQrisPayment = async (req, res) => {
  try {
    const { reference } = req.params;
    const user_id = req.userId || req.body.user_id || req.query.user_id;

    if (!reference || !user_id) {
      res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
      return res.status(400).json({ error: "Missing reference or user_id" });
    }

    const payment = await QrisPayment.findOne({ where: { reference, user_id } });
    if (!payment) {
      res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
      return res.status(404).json({ error: "Payment not found" });
    }

    if (!['UNPAID','PENDING_VERIFICATION'].includes(payment.status)) {
      res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  return res.status(400).json({ error: "Only UNPAID or PENDING_VERIFICATION payments can be canceled" });
}

await payment.update({ status: "CANCELED" });

    return res.json({ success: true, message: "Payment canceled successfully" });
  } catch (error) {
    console.error("Error canceling payment:", error);
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};

module.exports = {
  getQrisSettings,
  saveQrisSettings,
  createQrisPayment,
  uploadPaymentProof,
  getUserQrisPayments,
  getAllQrisPayments,
  verifyQrisPayment,
  getWhatsAppGroupSettings,
  saveWhatsAppGroupSettings,
  uploadPaymentProofBase64,
  cancelQrisPayment
};