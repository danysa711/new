// File: express/routes/settings.js

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { authenticateUser, requireAdmin } = require('../middlewares/auth');

// Path ke file penyimpanan pengaturan
const settingsFilePath = path.join(__dirname, '../data/whatsapp-trial-settings.json');

// Fungsi untuk memastikan direktori data ada
const ensureDataDirectoryExists = () => {
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Fungsi untuk membaca pengaturan
const readSettings = () => {
  ensureDataDirectoryExists();
  
  // Pengaturan default
  const defaultSettings = {
    whatsappNumber: '6281284712684',
    messageTemplate: 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}',
    isEnabled: true,
    updatedAt: new Date().toISOString()
  };
  
  try {
    if (fs.existsSync(settingsFilePath)) {
      const data = fs.readFileSync(settingsFilePath, 'utf8');
      return JSON.parse(data);
    }
    
    // Jika file tidak ada, tulis pengaturan default
    fs.writeFileSync(settingsFilePath, JSON.stringify(defaultSettings, null, 2));
    return defaultSettings;
  } catch (error) {
    console.error('Error reading settings file:', error);
    return defaultSettings;
  }
};

// Fungsi untuk menulis pengaturan
const writeSettings = (settings) => {
  ensureDataDirectoryExists();
  
  try {
    fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing settings file:', error);
    return false;
  }
};

// Route publik untuk mendapatkan pengaturan WhatsApp trial
router.get('/settings/whatsapp-trial', async (req, res) => {
  try {
    console.log('Public WhatsApp settings request received');
    const settings = readSettings();
    return res.json(settings);
  } catch (error) {
    console.error('Error fetching WhatsApp trial settings:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Route admin untuk mendapatkan pengaturan WhatsApp trial
router.get('/admin/settings/whatsapp-trial', authenticateUser, requireAdmin, async (req, res) => {
  try {
    console.log('Admin WhatsApp settings request received');
    const settings = readSettings();
    return res.json(settings);
  } catch (error) {
    console.error('Error fetching WhatsApp trial settings:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Route admin untuk menyimpan pengaturan WhatsApp trial
router.post('/admin/settings/whatsapp-trial', authenticateUser, requireAdmin, async (req, res) => {
  try {
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

module.exports = router;