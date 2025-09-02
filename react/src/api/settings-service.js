// src/api/settings-service.js

import axiosInstance from './axios';
import { API_ENDPOINTS } from './config';

/**
 * Service untuk pengaturan aplikasi
 */

// Mendapatkan pengaturan WhatsApp trial
export const getWhatsAppTrialSettings = async () => {
  try {
    const response = await axiosInstance.get(API_ENDPOINTS.WHATSAPP_TRIAL);
    return response.data;
  } catch (error) {
    console.error('Error fetching WhatsApp trial settings:', error);
    
    // Coba ambil dari localStorage sebagai fallback
    try {
      const whatsappNumber = localStorage.getItem('whatsapp_trial_number');
      const messageTemplate = localStorage.getItem('whatsapp_trial_template');
      const isEnabled = localStorage.getItem('whatsapp_trial_enabled') !== 'false';
      
      if (whatsappNumber && messageTemplate) {
        return {
          whatsappNumber,
          messageTemplate,
          isEnabled
        };
      }
    } catch (e) {
      console.error('Error reading from localStorage:', e);
    }
    
    // Return default jika tidak ada di localStorage
    return {
      whatsappNumber: '6281284712684',
      messageTemplate: 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}',
      isEnabled: true
    };
  }
};

// Menyimpan pengaturan WhatsApp trial (hanya untuk admin)
export const saveWhatsAppTrialSettings = async (settings) => {
  try {
    // Validasi input
    if (!settings.whatsappNumber) {
      return { success: false, error: 'Nomor WhatsApp harus diisi' };
    }
    
    if (!settings.messageTemplate) {
      return { success: false, error: 'Template pesan harus diisi' };
    }
    
    // Format nomor WhatsApp
    const whatsappRegex = /^[0-9+]{8,15}$/;
    if (!whatsappRegex.test(settings.whatsappNumber)) {
      return { success: false, error: 'Format nomor WhatsApp tidak valid' };
    }
    
    // Kirim ke server
    const response = await axiosInstance.post('/api/admin/settings/whatsapp-trial?admin=true', settings);
    
    // Simpan juga ke localStorage sebagai backup
    localStorage.setItem('whatsapp_trial_number', settings.whatsappNumber);
    localStorage.setItem('whatsapp_trial_template', settings.messageTemplate);
    localStorage.setItem('whatsapp_trial_enabled', settings.isEnabled.toString());
    
    return { success: true, message: 'Pengaturan berhasil disimpan', data: response.data };
  } catch (error) {
    console.error('Error saving WhatsApp trial settings:', error);
    
    // Tetap simpan ke localStorage jika server error
    localStorage.setItem('whatsapp_trial_number', settings.whatsappNumber);
    localStorage.setItem('whatsapp_trial_template', settings.messageTemplate);
    localStorage.setItem('whatsapp_trial_enabled', settings.isEnabled.toString());
    
    return { 
      success: false, 
      error: error.response?.data?.error || 'Gagal menyimpan pengaturan',
      local: true // Tandai bahwa hanya tersimpan di localStorage
    };
  }
};