// express/controllers/whatsappController.js
const whatsappService = require('../services/whatsappService');
const { Settings, PaymentSettings } = require('../models');
const fs = require('fs');
const path = require('path');

// Inisialisasi WhatsApp
const initWhatsApp = async (req, res) => {
  try {
    // Hanya admin yang boleh menginisialisasi
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }

    // Set handler untuk event WhatsApp
    whatsappService.setCallbacks({
      onQrCode: (qrCode) => {
        console.log("QR Code generated (but we're using Baileys, so it's displayed in terminal)");
      },
      onReady: () => {
        console.log("WhatsApp client is ready");
      },
      onAuthenticated: () => {
        console.log("WhatsApp client is authenticated");
      },
      onDisconnected: (reason) => {
        console.log("WhatsApp client disconnected:", reason);
      }
    });

    const success = await whatsappService.initWhatsApp();

    if (!success) {
      return res.status(500).json({ error: "Gagal menginisialisasi WhatsApp" });
    }

    return res.status(200).json({ message: "WhatsApp berhasil diinisialisasi. Silakan cek QR code di terminal server." });
  } catch (error) {
    console.error("Error initializing WhatsApp:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

// Mendapatkan status WhatsApp
const getWhatsAppStatus = async (req, res) => {
  try {
    // Hanya admin yang boleh mendapatkan status
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }

    const status = whatsappService.getStatus();
    return res.status(200).json(status);
  } catch (error) {
    console.error("Error getting WhatsApp status:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

// Logout WhatsApp
const logoutWhatsApp = async (req, res) => {
  try {
    // Hanya admin yang boleh logout
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }

    const success = await whatsappService.logout();

    if (!success) {
      return res.status(500).json({ error: "Gagal logout dari WhatsApp" });
    }

    return res.status(200).json({ message: "WhatsApp berhasil logout" });
  } catch (error) {
    console.error("Error logging out WhatsApp:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

// Mendapatkan daftar grup WhatsApp
const getWhatsAppGroups = async (req, res) => {
  try {
    // Hanya admin yang boleh mendapatkan daftar grup
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }

    const result = await whatsappService.getGroups();

    if (!result.success) {
      return res.status(500).json({ error: result.message || "Gagal mendapatkan daftar grup" });
    }

    return res.status(200).json({ groups: result.groups });
  } catch (error) {
    console.error("Error getting WhatsApp groups:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

// Set grup admin WhatsApp
const setAdminGroup = async (req, res) => {
  try {
    // Hanya admin yang boleh mengatur grup
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }

    const { group_id, group_name } = req.body;

    if (!group_id || !group_name) {
      return res.status(400).json({ error: "ID grup dan nama grup harus diisi" });
    }

    const success = await whatsappService.setAdminGroup(group_id, group_name);

    if (!success) {
      return res.status(500).json({ error: "Gagal mengatur grup admin" });
    }

    // Update pengaturan untuk mengaktifkan WhatsApp
    const paymentSettings = await PaymentSettings.findOne({ order: [['id', 'DESC']] });

    if (paymentSettings) {
      await paymentSettings.update({ whatsapp_enabled: true });
    } else {
      await PaymentSettings.create({ whatsapp_enabled: true });
    }

    return res.status(200).json({ 
      message: "Grup admin berhasil diatur", 
      group: { id: group_id, name: group_name }
    });
  } catch (error) {
    console.error("Error setting admin group:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

// Kirim pesan uji
const sendTestMessage = async (req, res) => {
  try {
    // Hanya admin yang boleh mengirim pesan uji
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }

    const { phone_number, message } = req.body;

    if (!phone_number || !message) {
      return res.status(400).json({ error: "Nomor telepon dan pesan harus diisi" });
    }

    const success = await whatsappService.sendMessageToUser(phone_number, message);

    if (!success) {
      return res.status(500).json({ error: "Gagal mengirim pesan uji" });
    }

    return res.status(200).json({ message: "Pesan uji berhasil dikirim" });
  } catch (error) {
    console.error("Error sending test message:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

module.exports = {
  initWhatsApp,
  getWhatsAppStatus,
  logoutWhatsApp,
  getWhatsAppGroups,
  setAdminGroup,
  sendTestMessage
};