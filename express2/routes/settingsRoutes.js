// File: express/routes/settingsRoutes.js

const express = require('express');
const router = express.Router();
const { authenticateUser, requireAdmin } = require('../middlewares/auth');
const qrisController = require("../controllers/qrisController");
const fs = require('fs');
const path = require('path');

// Path untuk menyimpan pengaturan di file
const SETTINGS_FILE_PATH = path.join(__dirname, '../data/whatsapp_trial_settings.json');

// Pengaturan default
const DEFAULT_SETTINGS = {
  whatsappNumber: '6281284712684',
  messageTemplate: 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}',
  isEnabled: true,
  updatedAt: new Date().toISOString()
};

// Fungsi untuk memastikan folder data ada
const ensureDataFolderExists = () => {
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
    } catch (err) {
      console.error('Error creating data directory:', err);
      // Jangan throw error, biarkan fungsi berjalan terus
    }
  }
};

// Fungsi untuk membaca pengaturan dari file
const readSettings = () => {
  try {
    ensureDataFolderExists();
    
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const data = fs.readFileSync(SETTINGS_FILE_PATH, 'utf8');
      return JSON.parse(data);
    }
    
    // Jika file tidak ada, buat file dengan pengaturan default
    writeSettings(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  } catch (err) {
    console.error('Error reading settings file:', err);
    return DEFAULT_SETTINGS;
  }
};

// Fungsi untuk menulis pengaturan ke file
const writeSettings = (settings) => {
  try {
    ensureDataFolderExists();
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing settings file:', err);
    return false;
  }
};

// Endpoint publik untuk mendapatkan pengaturan WhatsApp trial
router.get('/settings/whatsapp-trial', (req, res) => {
  try {
    console.log('Public WhatsApp settings request received');
    const settings = readSettings();
    return res.json(settings);
  } catch (error) {
    console.error('Error fetching WhatsApp trial settings:', error);
    return res.json(DEFAULT_SETTINGS); // Selalu kembalikan default jika error
  }
});

// Endpoint admin untuk mendapatkan pengaturan WhatsApp trial
router.get('/admin/settings/whatsapp-trial', authenticateUser, requireAdmin, (req, res) => {
  try {
    console.log('Admin WhatsApp settings request received');
    const settings = readSettings();
    return res.json(settings);
  } catch (error) {
    console.error('Error fetching admin WhatsApp trial settings:', error);
    return res.json(DEFAULT_SETTINGS); // Selalu kembalikan default jika error
  }
});

// Endpoint admin untuk menyimpan pengaturan WhatsApp trial
router.post('/admin/settings/whatsapp-trial', authenticateUser, requireAdmin, (req, res) => {
  try {
    console.log('Save WhatsApp settings request received:', req.body);
    const { whatsappNumber, messageTemplate, isEnabled } = req.body;
    
    // Validasi input
    if (!whatsappNumber) {
      return res.status(400).json({ message: 'Nomor WhatsApp harus diisi' });
    }
    
    if (!messageTemplate) {
      return res.status(400).json({ message: 'Template pesan harus diisi' });
    }
    
    // Format nomor WhatsApp
    const whatsappRegex = /^[0-9+]{8,15}$/;
    if (!whatsappRegex.test(whatsappNumber)) {
      return res.status(400).json({ message: 'Format nomor WhatsApp tidak valid' });
    }
    
    // Validasi isEnabled
    if (typeof isEnabled !== 'boolean') {
      return res.status(400).json({ message: 'Status aktif harus berupa boolean' });
    }
    
    // Buat direktori jika tidak ada
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Update settings
    const newSettings = {
      whatsappNumber,
      messageTemplate,
      isEnabled,
      updatedAt: new Date().toISOString()
    };
    
    // Tulis ke file
    fs.writeFileSync(
      path.join(__dirname, '../data/whatsapp_trial_settings.json'),
      JSON.stringify(newSettings, null, 2),
      'utf8'
    );
    
    // Tulis juga ke file cadangan
    fs.writeFileSync(
      path.join(__dirname, '../data/whatsapp-trial-settings.json'),
      JSON.stringify(newSettings, null, 2),
      'utf8'
    );
    
    return res.json({ 
      message: 'Pengaturan berhasil disimpan', 
      settings: newSettings
    });
  } catch (error) {
    console.error('Error saving WhatsApp trial settings:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/settings/tripay-status', async (req, res) => {
  try {
    const tripayEnabled = await Setting.findOne({ where: { key: 'tripay_enabled' } });
    
    res.json({
      enabled: tripayEnabled ? tripayEnabled.value === 'true' : false
    });
  } catch (err) {
    console.error('Error fetching Tripay status:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Tambahkan endpoint untuk menyetel status Tripay
router.post('/settings/tripay', authenticateUser, async (req, res) => {
  try {
    const { tripay_enabled } = req.body;
    
    let setting = await Setting.findOne({ where: { key: 'tripay_enabled' } });
    
    if (setting) {
      setting.value = tripay_enabled ? 'true' : 'false';
      await setting.save();
    } else {
      await Setting.create({
        key: 'tripay_enabled',
        value: tripay_enabled ? 'true' : 'false'
      });
    }
    
    res.json({ message: 'Tripay settings updated', status: tripay_enabled });
  } catch (err) {
    console.error('Error updating Tripay settings:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get("/settings/public", (req, res) => {
  // Kirim informasi publik minimal
  res.json({
    apiVersion: "3.0.9",
    serverTime: new Date().toISOString(),
    features: {
      qris: true,
      whatsapp: true
    }
  });
});

// Endpoint publik untuk pengaturan QRIS
router.get("/settings/qris-public", async (req, res) => {
  try {
    // Dapatkan pengaturan QRIS
    const qrisSettings = await QrisSettings.findOne({
      where: { is_active: true },
      attributes: ['merchant_name', 'is_active', 'instructions'] // Hanya kirim data yang aman
    });
    
    if (!qrisSettings) {
      return res.json({
        merchant_name: "Kinterstore",
        is_active: true,
        instructions: "Scan kode QR menggunakan aplikasi e-wallet atau mobile banking Anda."
      });
    }
    
    return res.json(qrisSettings);
  } catch (error) {
    console.error("Error getting public QRIS settings:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// Endpoint yang memerlukan autentikasi
router.get("/settings/qris", authenticateUser, qrisController.getQrisSettings);
router.post("/settings/qris", authenticateUser, requireAdmin, qrisController.saveQrisSettings);


module.exports = router;