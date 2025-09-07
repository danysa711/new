// controllers/settingsController.js
const { WhatsAppSetting } = require('../models');

// Mendapatkan pengaturan WhatsApp terpadu
const getWhatsappSettings = async (req, res) => {
  try {
    // Ambil setting terbaru (dengan ID tertinggi)
    const settings = await WhatsAppSetting.findOne({
      order: [['id', 'DESC']]
    });
    
    if (!settings) {
      // Jika tidak ada pengaturan, kembalikan default
      return res.json({
        whatsappNumber: '6281284712684',
        trialEnabled: true,
        messageTemplate: 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}'
      });
    }
    
    // Format untuk API baru
    res.json({
      whatsappNumber: settings.whatsapp_number,
      trialEnabled: settings.trial_enabled,
      messageTemplate: settings.trial_template
    });
  } catch (err) {
    console.error('Error mengambil pengaturan WhatsApp:', err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Menyimpan pengaturan WhatsApp baru
const saveWhatsappSettings = async (req, res) => {
  try {
    const { whatsappNumber, trialEnabled, messageTemplate } = req.body;
    
    // Validasi input
    if (!whatsappNumber) {
      return res.status(400).json({ error: 'Nomor WhatsApp harus diisi' });
    }
    
    // Format nomor WhatsApp
    const whatsappRegex = /^[0-9+]{8,15}$/;
    if (!whatsappRegex.test(whatsappNumber)) {
      return res.status(400).json({ error: 'Format nomor WhatsApp tidak valid' });
    }
    
    // Buat setting baru
    await WhatsAppSetting.create({
      whatsapp_number: whatsappNumber,
      trial_enabled: trialEnabled !== undefined ? trialEnabled : true,
      trial_template: messageTemplate || 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}',
      support_enabled: true // Default support_enabled ke true
    });
    
    res.json({ success: true, message: 'Pengaturan WhatsApp berhasil disimpan' });
  } catch (err) {
    console.error('Error menyimpan pengaturan WhatsApp:', err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// BACKWARD COMPATIBILITY: Mendapatkan pengaturan WhatsApp trial
const getWhatsappTrialSettings = async (req, res) => {
  try {
    // Ambil setting terbaru (dengan ID tertinggi)
    const settings = await WhatsAppSetting.findOne({
      order: [['id', 'DESC']]
    });
    
    if (!settings) {
      // Jika tidak ada pengaturan, kembalikan default
      return res.json({
        isEnabled: true,
        whatsappNumber: '6281284712684',
        messageTemplate: 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}'
      });
    }
    
    // Format untuk API lama
    res.json({
      isEnabled: settings.trial_enabled,
      whatsappNumber: settings.whatsapp_number,
      messageTemplate: settings.trial_template
    });
  } catch (err) {
    console.error('Error mengambil pengaturan WhatsApp trial:', err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Support Number (backward compatibility)
const getSupportNumber = async (req, res) => {
  try {
    const settings = await WhatsAppSetting.findOne({
      order: [['id', 'DESC']]
    });
    
    res.json({
      whatsappNumber: settings ? settings.whatsapp_number : '6281284712684'
    });
  } catch (err) {
    console.error('Error mengambil nomor support:', err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Save Support Number (backward compatibility)
const saveSupportNumber = async (req, res) => {
  try {
    const { whatsappNumber } = req.body;
    
    // Validasi input
    if (!whatsappNumber) {
      return res.status(400).json({ error: 'Nomor WhatsApp harus diisi' });
    }
    
    // Format nomor WhatsApp
    const whatsappRegex = /^[0-9+]{8,15}$/;
    if (!whatsappRegex.test(whatsappNumber)) {
      return res.status(400).json({ error: 'Format nomor WhatsApp tidak valid' });
    }
    
    // Ambil setting terbaru
    const existingSettings = await WhatsAppSetting.findOne({
      order: [['id', 'DESC']]
    });
    
    if (existingSettings) {
      // Buat setting baru berdasarkan yang sudah ada
      await WhatsAppSetting.create({
        whatsapp_number: whatsappNumber,
        trial_enabled: existingSettings.trial_enabled,
        trial_template: existingSettings.trial_template,
        support_enabled: true
      });
    } else {
      // Buat setting baru dengan default
      await WhatsAppSetting.create({
        whatsapp_number: whatsappNumber,
        trial_enabled: true,
        trial_template: 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}',
        support_enabled: true
      });
    }
    
    res.json({ success: true, message: 'Nomor support berhasil disimpan' });
  } catch (err) {
    console.error('Error menyimpan nomor support:', err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Save WhatsApp Trial Settings (backward compatibility)
const saveWhatsappTrialSettings = async (req, res) => {
  try {
    const { isEnabled, whatsappNumber, messageTemplate } = req.body;
    
    // Validasi input
    if (!whatsappNumber) {
      return res.status(400).json({ error: 'Nomor WhatsApp harus diisi' });
    }
    
    // Format nomor WhatsApp
    const whatsappRegex = /^[0-9+]{8,15}$/;
    if (!whatsappRegex.test(whatsappNumber)) {
      return res.status(400).json({ error: 'Format nomor WhatsApp tidak valid' });
    }
    
    // Buat setting baru
    await WhatsAppSetting.create({
      whatsapp_number: whatsappNumber,
      trial_enabled: isEnabled !== undefined ? isEnabled : true,
      trial_template: messageTemplate || 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}',
      support_enabled: true
    });
    
    res.json({ success: true, message: 'Pengaturan trial berhasil disimpan' });
  } catch (err) {
    console.error('Error menyimpan pengaturan trial:', err);
    res.status(500).json({ error: 'Server Error' });
  }
};

module.exports = {
  getWhatsappSettings,
  saveWhatsappSettings,
  getWhatsappTrialSettings,
  getSupportNumber,
  saveSupportNumber,
  saveWhatsappTrialSettings
};