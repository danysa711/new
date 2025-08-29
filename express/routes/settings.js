// File: /volume1/homes/vins/web/express/routes/settings.js

const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const adminAuth = require('../middlewares/adminAuth');
const mongoose = require('mongoose');

// Buat model Schema secara inline jika belum ada file model terpisah
let WhatsAppTrialSettings;
try {
  // Coba dapatkan model yang sudah ada
  WhatsAppTrialSettings = mongoose.model('WhatsAppTrialSettings');
} catch (error) {
  // Buat model baru jika belum ada
  const whatsAppTrialSettingsSchema = new mongoose.Schema({
    whatsappNumber: {
      type: String,
      required: true,
      default: '6281284712684'
    },
    messageTemplate: {
      type: String,
      required: true,
      default: 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}'
    },
    isEnabled: {
      type: Boolean,
      default: true
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  });
  
  WhatsAppTrialSettings = mongoose.model('WhatsAppTrialSettings', whatsAppTrialSettingsSchema);
}

// Untuk debugging
router.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`, {
    headers: {
      origin: req.headers.origin,
      referer: req.headers.referer
    }
  });
  next();
});

// Route publik untuk mendapatkan pengaturan WhatsApp trial
// Tidak memerlukan autentikasi
router.get('/settings/whatsapp-trial', async (req, res) => {
  try {
    // Catat informasi request untuk debugging
    console.log('Public WhatsApp settings request from:', req.headers.origin);
    
    // Cari pengaturan yang ada atau gunakan default jika tidak ada
    let settings = await WhatsAppTrialSettings.findOne().lean();
    
    if (!settings) {
      settings = {
        whatsappNumber: '6281284712684',
        messageTemplate: 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}',
        isEnabled: true
      };
    }
    
    return res.json(settings);
  } catch (error) {
    console.error('Error fetching WhatsApp trial settings for user:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Route admin untuk mendapatkan pengaturan WhatsApp trial
router.get('/admin/settings/whatsapp-trial', auth, adminAuth, async (req, res) => {
  try {
    // Catat informasi request untuk debugging
    console.log('Admin WhatsApp settings request from:', req.user ? req.user.username : 'unknown');
    
    // Cari pengaturan yang ada atau gunakan default jika tidak ada
    let settings = await WhatsAppTrialSettings.findOne().lean();
    
    if (!settings) {
      settings = {
        whatsappNumber: '6281284712684',
        messageTemplate: 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}',
        isEnabled: true
      };
    }
    
    return res.json(settings);
  } catch (error) {
    console.error('Error fetching WhatsApp trial settings:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Route admin untuk menyimpan pengaturan WhatsApp trial
router.post('/admin/settings/whatsapp-trial', auth, adminAuth, async (req, res) => {
  try {
    // Ambil data dari request body
    const { whatsappNumber, messageTemplate, isEnabled } = req.body;
    
    // Validasi manual
    if (!whatsappNumber) {
      return res.status(400).json({ message: 'Nomor WhatsApp harus diisi' });
    }
    
    if (!messageTemplate) {
      return res.status(400).json({ message: 'Template pesan harus diisi' });
    }
    
    // Validasi format nomor WhatsApp
    const whatsappRegex = /^[0-9+]{8,15}$/;
    if (!whatsappRegex.test(whatsappNumber)) {
      return res.status(400).json({ message: 'Format nomor WhatsApp tidak valid' });
    }
    
    // Validasi isEnabled
    if (typeof isEnabled !== 'boolean') {
      return res.status(400).json({ message: 'Status aktif harus berupa boolean' });
    }
    
    // Catat informasi request untuk debugging
    console.log('Saving WhatsApp settings by:', req.user ? req.user.username : 'unknown', req.body);
    
    // Cari pengaturan yang ada atau buat baru jika tidak ada
    let settings = await WhatsAppTrialSettings.findOne();
    
    if (settings) {
      // Update pengaturan yang ada
      settings.whatsappNumber = whatsappNumber;
      settings.messageTemplate = messageTemplate;
      settings.isEnabled = isEnabled;
      settings.updatedAt = Date.now();
    } else {
      // Buat pengaturan baru
      settings = new WhatsAppTrialSettings({
        whatsappNumber,
        messageTemplate,
        isEnabled
      });
    }
    
    await settings.save();
    
    return res.json({ 
      message: 'Pengaturan berhasil disimpan', 
      settings: settings.toObject() 
    });
  } catch (error) {
    console.error('Error saving WhatsApp trial settings:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;