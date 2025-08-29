// File: express/routes/settingsRoutes.js

const express = require('express');
const router = express.Router();
const { authenticateUser, requireAdmin } = require('../middlewares/auth');
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
    
    // Update settings
    const newSettings = {
      whatsappNumber,
      messageTemplate,
      isEnabled,
      updatedAt: new Date().toISOString()
    };
    
    const success = writeSettings(newSettings);
    
    if (success) {
      return res.json({ 
        message: 'Pengaturan berhasil disimpan', 
        settings: newSettings 
      });
    } else {
      return res.status(500).json({ message: 'Gagal menyimpan pengaturan' });
    }
  } catch (error) {
    console.error('Error saving WhatsApp trial settings:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Endpoint fallback yang selalu mengembalikan pengaturan default
router.get('/settings/whatsapp-trial-default', (req, res) => {
  console.log('Fallback WhatsApp settings request received');
  return res.json(DEFAULT_SETTINGS);
});

module.exports = router;