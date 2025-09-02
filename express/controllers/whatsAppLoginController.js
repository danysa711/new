// express/controllers/whatsAppLoginController.js
const { User } = require("../models");
const whatsappClient = require('../utils/whatsapp-client');

// Membuat QR code untuk login WhatsApp
const generateWhatsAppQR = async (req, res) => {
  try {
    // Inisialisasi client WhatsApp
    whatsappClient.initClient();
    
    // Tunggu beberapa detik untuk mendapatkan QR code
    let attempts = 0;
    let qrCode = null;
    
    while (attempts < 10 && !qrCode) {
      qrCode = await whatsappClient.getQrCode();
      if (!qrCode) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
    }
    
    if (!qrCode) {
      return res.status(500).json({ 
        error: "Failed to generate QR code", 
        message: "Gagal membuat QR code, silakan coba lagi" 
      });
    }
    
    // Send QR code to client
    res.status(200).json({
      message: "QR code generated successfully",
      qr_code: qrCode,
      instructions: "Scan QR code dengan aplikasi WhatsApp di ponsel Anda"
    });
  } catch (error) {
    console.error("Error generating WhatsApp QR:", error);
    return res.status(500).json({ error: "Server error", message: error.message });
  }
};

// Mendapatkan status koneksi WhatsApp
const getWhatsAppStatus = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Cek status client
    const isConnected = whatsappClient.isReady();
    
    // Update status user
    if (isConnected) {
      const user = await User.findByPk(userId);
      
      if (user) {
        await user.update({ 
          whatsapp_connected: true,
          whatsapp_number: user.whatsapp_number || "Not set"
        });
      }
    }
    
    return res.status(200).json({
      whatsapp_connected: isConnected,
      message: isConnected ? "WhatsApp terhubung" : "WhatsApp tidak terhubung"
    });
  } catch (error) {
    console.error("Error getting WhatsApp status:", error);
    return res.status(500).json({ error: "Server error", message: error.message });
  }
};

// Logout dari WhatsApp
const logoutWhatsApp = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Logout dari WhatsApp
    const success = await whatsappClient.logout();
    
    if (success) {
      // Update user dengan WhatsApp disconnected status
      await User.update(
        { whatsapp_connected: false },
        { where: { id: userId } }
      );
      
      return res.status(200).json({
        message: "WhatsApp logged out successfully"
      });
    } else {
      return res.status(500).json({
        error: "Failed to logout from WhatsApp"
      });
    }
  } catch (error) {
    console.error("Error logging out WhatsApp:", error);
    return res.status(500).json({ error: "Server error", message: error.message });
  }
};

// Manually connect WhatsApp
const connectWhatsApp = async (req, res) => {
  try {
    const userId = req.userId;
    const { whatsapp_number } = req.body;
    
    if (!whatsapp_number) {
      return res.status(400).json({ error: "WhatsApp number is required" });
    }
    
    // Test send message
    const message = "WhatsApp verification test message";
    const formattedNumber = whatsapp_number.replace(/[^0-9]/g, "");
    
    // Jika client belum ready, gunakan update manual
    if (!whatsappClient.isReady()) {
      // Update user with WhatsApp connected status
      await User.update(
        { 
          whatsapp_connected: true,
          whatsapp_number: formattedNumber
        },
        { where: { id: userId } }
      );
      
      return res.status(200).json({
        message: "WhatsApp connected successfully (manual mode)",
        whatsapp_number: formattedNumber,
        note: "WhatsApp client is not ready, using manual mode"
      });
    }
    
    // Jika client ready, coba kirim test message
    const sent = await whatsappClient.sendMessage(formattedNumber, message);
    
    if (sent) {
      // Update user with WhatsApp connected status
      await User.update(
        { 
          whatsapp_connected: true,
          whatsapp_number: formattedNumber
        },
        { where: { id: userId } }
      );
      
      return res.status(200).json({
        message: "WhatsApp connected successfully",
        whatsapp_number: formattedNumber
      });
    } else {
      return res.status(500).json({
        error: "Failed to send test message",
        message: "WhatsApp connected but test message failed"
      });
    }
  } catch (error) {
    console.error("Error connecting WhatsApp:", error);
    return res.status(500).json({ error: "Server error", message: error.message });
  }
};

module.exports = {
  generateWhatsAppQR,
  getWhatsAppStatus,
  logoutWhatsApp,
  connectWhatsApp
};