// express/controllers/paymentSettingsController.js
const { PaymentSettings } = require('../models');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Konfigurasi upload multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'qris-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Batas ukuran file (5MB)
  fileFilter: function (req, file, cb) {
    // Hanya terima file gambar
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diizinkan'), false);
    }
  }
}).single('qris_image');

// Mendapatkan pengaturan pembayaran
const getPaymentSettings = async (req, res) => {
  try {
    let settings = await PaymentSettings.findOne({ order: [['id', 'DESC']] });
    
    // Jika tidak ada, buat default
    if (!settings) {
      settings = await PaymentSettings.create({});
    }
    
    // Buat URL untuk akses QRIS jika ada
    if (settings.qris_image_url) {
      // URL sudah ada, gunakan itu
    } else if (settings.qris_image) {
      // Generate URL untuk akses gambar dari API
      const baseUrl = process.env.BACKEND_URL || req.protocol + '://' + req.get('host');
      settings.dataValues.qris_image_url = `${baseUrl}/api/payment-settings/qris-image`;
    }
    
    // Hapus data binary blob dari respons
    if (settings.dataValues.qris_image) {
      delete settings.dataValues.qris_image;
    }
    
    return res.status(200).json(settings);
  } catch (error) {
    console.error("Error getting payment settings:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

// Update pengaturan pembayaran
const updatePaymentSettings = async (req, res) => {
  try {
    // Hanya admin yang boleh mengupdate
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }
    
    upload(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        // Error dari multer
        return res.status(400).json({ error: `Error upload: ${err.message}` });
      } else if (err) {
        // Error lainnya
        return res.status(400).json({ error: err.message });
      }
      
      // Dapatkan data dari body
      const { 
        payment_expiry_hours,
        verification_message_template,
        success_message_template,
        rejected_message_template,
        whatsapp_enabled,
        max_pending_orders,
        remove_qris_image
      } = req.body;
      
      // Validasi beberapa input
      if (payment_expiry_hours && (isNaN(payment_expiry_hours) || payment_expiry_hours < 1)) {
        return res.status(400).json({ error: "Batas waktu pembayaran harus berupa angka positif" });
      }
      
      if (max_pending_orders && (isNaN(max_pending_orders) || max_pending_orders < 1)) {
        return res.status(400).json({ error: "Maksimal pesanan tertunda harus berupa angka positif" });
      }
      
      // Ambil pengaturan yang ada atau buat baru jika belum ada
      let settings = await PaymentSettings.findOne({ order: [['id', 'DESC']] });
      if (!settings) {
        settings = await PaymentSettings.create({});
      }
      
      // Persiapkan data untuk update
      const updateData = {
        payment_expiry_hours: payment_expiry_hours || settings.payment_expiry_hours,
        verification_message_template: verification_message_template || settings.verification_message_template,
        whatsapp_enabled: whatsapp_enabled !== undefined ? whatsapp_enabled : settings.whatsapp_enabled,
        max_pending_orders: max_pending_orders || settings.max_pending_orders,
        success_message_template: success_message_template || settings.success_message_template,
        rejected_message_template: rejected_message_template || settings.rejected_message_template,
        whatsapp_enabled: whatsapp_enabled !== undefined ? whatsapp_enabled : settings.whatsapp_enabled,
        max_pending_orders: max_pending_orders || settings.max_pending_orders
      };
      
      // Handle QRIS image
      if (req.file) {
        // Baca file yang diunggah
        const qrisImageData = fs.readFileSync(req.file.path);
        updateData.qris_image = qrisImageData;
        updateData.qris_image_url = null; // Reset URL eksternal jika menggunakan file upload
        
        // Hapus file temporary
        fs.unlinkSync(req.file.path);
      } else if (remove_qris_image === 'true') {
        // Jika ada permintaan untuk menghapus gambar
        updateData.qris_image = null;
        updateData.qris_image_url = null;
      }
      
      // Update pengaturan
      await settings.update(updateData);
      
      // Ambil pengaturan terbaru
      settings = await PaymentSettings.findByPk(settings.id);
      
      // Buat URL untuk akses QRIS jika ada
      if (settings.qris_image_url) {
        // URL sudah ada, gunakan itu
      } else if (settings.qris_image) {
        // Generate URL untuk akses gambar dari API
        const baseUrl = process.env.BACKEND_URL || req.protocol + '://' + req.get('host');
        settings.dataValues.qris_image_url = `${baseUrl}/api/payment-settings/qris-image`;
      }
      
      // Hapus data binary blob dari respons
      if (settings.dataValues.qris_image) {
        delete settings.dataValues.qris_image;
      }
      
      return res.status(200).json({
        message: "Pengaturan pembayaran berhasil diperbarui",
        settings
      });
    });
  } catch (error) {
    console.error("Error updating payment settings:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

// Mendapatkan gambar QRIS
const getQrisImage = async (req, res) => {
  try {
    const settings = await PaymentSettings.findOne({ order: [['id', 'DESC']] });
    
    if (!settings || !settings.qris_image) {
      return res.status(404).send('Gambar QRIS tidak ditemukan');
    }
    
    // Set header untuk cache
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache selama 1 hari
    res.setHeader('Content-Type', 'image/png'); // Asumsi format PNG, sesuaikan jika berbeda
    
    // Kirim gambar
    res.send(settings.qris_image);
  } catch (error) {
    console.error("Error getting QRIS image:", error);
    res.status(500).send('Terjadi kesalahan pada server');
  }
};

// Update hanya URL gambar QRIS dari eksternal
const updateQrisImageUrl = async (req, res) => {
  try {
    // Hanya admin yang boleh mengupdate
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }
    
    const { qris_image_url } = req.body;
    
    if (!qris_image_url) {
      return res.status(400).json({ error: "URL gambar QRIS harus diisi" });
    }
    
    // Ambil pengaturan yang ada atau buat baru jika belum ada
    let settings = await PaymentSettings.findOne({ order: [['id', 'DESC']] });
    if (!settings) {
      settings = await PaymentSettings.create({});
    }
    
    // Update URL gambar QRIS dan hapus gambar yang diupload (jika ada)
    await settings.update({
      qris_image_url,
      qris_image: null
    });
    
    return res.status(200).json({
      message: "URL gambar QRIS berhasil diperbarui",
      qris_image_url
    });
  } catch (error) {
    console.error("Error updating QRIS image URL:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

// Reset pengaturan ke default
const resetSettings = async (req, res) => {
  try {
    // Hanya admin yang boleh reset
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }
    
    // Buat pengaturan default baru
    const newSettings = await PaymentSettings.create({
      payment_expiry_hours: 24,
      qris_image: null,
      qris_image_url: null,
      verification_message_template: `*VERIFIKASI PEMBAYARAN BARU*
    
Nama: {username}
Email: {email}
ID Transaksi: {transaction_id}
Paket: {plan_name}
Durasi: {duration} hari
Nominal: Rp {price}
Waktu: {datetime}

Balas pesan ini dengan angka:
*1* untuk *VERIFIKASI*
*2* untuk *TOLAK*`,
      success_message_template: `Halo {username},
        
Pembayaran Anda untuk paket *{plan_name}* telah *DIVERIFIKASI*.

Langganan Anda telah aktif dan akan berlaku hingga *{end_date}*.

Terima kasih telah berlangganan!`,
      rejected_message_template: `Halo {username},
        
Maaf, pembayaran Anda untuk paket *{plan_name}* telah *DITOLAK*.

Silakan coba lagi atau hubungi admin untuk informasi lebih lanjut.`,
      whatsapp_enabled: false,
      max_pending_orders: 3
    });
    
    return res.status(200).json({
      message: "Pengaturan pembayaran berhasil direset ke default",
      settings: newSettings
    });
  } catch (error) {
    console.error("Error resetting payment settings:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

module.exports = {
  getPaymentSettings,
  updatePaymentSettings,
  getQrisImage,
  updateQrisImageUrl,
  resetSettings
};