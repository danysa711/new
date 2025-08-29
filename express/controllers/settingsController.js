// File: express/controllers/settingsController.js

const { WhatsAppTrialSettings, db } = require("../models");

// Mendapatkan pengaturan WhatsApp trial publik
const getWhatsAppTrialSettings = async (req, res) => {
  try {
    // Cari pengaturan, ambil yang pertama atau buat default
    let settings = await WhatsAppTrialSettings.findOne();
    
    if (!settings) {
      // Jika tidak ada settings, buat default
      settings = await WhatsAppTrialSettings.create({
        whatsappNumber: '6281284712684',
        messageTemplate: 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}',
        isEnabled: true
      });
    }
    
    return res.json({
      whatsappNumber: settings.whatsappNumber,
      messageTemplate: settings.messageTemplate,
      isEnabled: settings.isEnabled
    });
  } catch (error) {
    console.error('Error fetching WhatsApp trial settings:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Mendapatkan pengaturan WhatsApp trial untuk admin
const getAdminWhatsAppTrialSettings = async (req, res) => {
  try {
    // Cari pengaturan, ambil yang pertama atau buat default
    let settings = await WhatsAppTrialSettings.findOne();
    
    if (!settings) {
      // Jika tidak ada settings, buat default
      settings = await WhatsAppTrialSettings.create({
        whatsappNumber: '6281284712684',
        messageTemplate: 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}',
        isEnabled: true
      });
    }
    
    return res.json({
      whatsappNumber: settings.whatsappNumber,
      messageTemplate: settings.messageTemplate,
      isEnabled: settings.isEnabled,
      updatedAt: settings.updatedAt
    });
  } catch (error) {
    console.error('Error fetching admin WhatsApp trial settings:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Menyimpan pengaturan WhatsApp trial
const saveWhatsAppTrialSettings = async (req, res) => {
  try {
    const { whatsappNumber, messageTemplate, isEnabled } = req.body;
    
    // Validasi input
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
    
    // Cari pengaturan yang ada atau buat baru
    let settings = await WhatsAppTrialSettings.findOne();
    
    if (settings) {
      // Update pengaturan yang ada
      await settings.update({
        whatsappNumber,
        messageTemplate,
        isEnabled,
        updatedAt: new Date()
      });
    } else {
      // Buat pengaturan baru
      settings = await WhatsAppTrialSettings.create({
        whatsappNumber,
        messageTemplate,
        isEnabled
      });
    }
    
    return res.json({ 
      message: 'Pengaturan berhasil disimpan', 
      settings: {
        whatsappNumber: settings.whatsappNumber,
        messageTemplate: settings.messageTemplate,
        isEnabled: settings.isEnabled,
        updatedAt: settings.updatedAt
      }
    });
  } catch (error) {
    console.error('Error saving WhatsApp trial settings:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

module.exports = {
  getWhatsAppTrialSettings,
  getAdminWhatsAppTrialSettings,
  saveWhatsAppTrialSettings
};