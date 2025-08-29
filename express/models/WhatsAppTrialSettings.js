// File: backend/models/WhatsAppTrialSettings.js

const mongoose = require('mongoose');

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

module.exports = mongoose.model('WhatsAppTrialSettings', whatsAppTrialSettingsSchema);