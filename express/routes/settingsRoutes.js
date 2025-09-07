// routes/settingsRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateUser, requireAdmin } = require('../middlewares/auth');
const settingsController = require('../controllers/settingsController');


router.get('/settings/whatsapp-public', settingsController.getWhatsappSettings);
// PENTING: Hilangkan middleware auth sementara sampai masalah teratasi
// API Baru: Rute pengaturan WhatsApp terpadu
router.get('/settings/whatsapp', authenticateUser, requireAdmin, settingsController.getWhatsappSettings);
router.post('/settings/whatsapp', authenticateUser, requireAdmin, settingsController.saveWhatsappSettings);

// Endpoint publik untuk mendapatkan nomor WhatsApp
router.get('/settings/whatsapp-public', settingsController.getWhatsappSettings);

// BACKWARD COMPATIBILITY: Support Settings
router.get('/settings/support-number', settingsController.getSupportNumber);
router.post('/admin/settings/support-number', settingsController.saveSupportNumber);

// BACKWARD COMPATIBILITY: WhatsApp Trial Settings
router.get('/settings/whatsapp-trial', settingsController.getWhatsappTrialSettings);
router.post('/admin/settings/whatsapp-trial', settingsController.saveWhatsappTrialSettings);

// Tambahkan endpoint untuk debug
router.get('/settings/debug', async (req, res) => {
  try {
    const { WhatsAppSetting } = require('../models');
    const allSettings = await WhatsAppSetting.findAll();
    res.json({
      count: allSettings.length,
      settings: allSettings,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Error debugging settings:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;