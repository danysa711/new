// routes/settingsRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateUser, requireAdmin } = require('../middlewares/auth');
const settingsController = require('../controllers/settingsController');


// Konfigurasi CORS khusus untuk endpoint publik
const corsOptions = {
  origin: ['https://www.kinterstore.my.id', 'https://kinterstore.my.id', 'https://db.kinterstore.my.id'],
  methods: 'GET,POST',
  credentials: true
};

router.get('/settings/whatsapp-public', settingsController.getWhatsappSettings);
// PENTING: Hilangkan middleware auth sementara sampai masalah teratasi
// API Baru: Rute pengaturan WhatsApp terpadu
router.get('/settings/whatsapp', authenticateUser, requireAdmin, settingsController.getWhatsappSettings);
router.post('/settings/whatsapp', authenticateUser, requireAdmin, settingsController.saveWhatsappSettings);

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