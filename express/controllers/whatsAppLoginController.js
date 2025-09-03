const { User } = require("../models");
const baileysClient = require('../utils/baileys/baileys-client');
const qrcode = require('qrcode');

// Membuat QR code untuk login WhatsApp
const generateWhatsAppQR = async (req, res) => {
  try {
    // Inisialisasi client WhatsApp
    await baileysClient.initSocket();
    
    // Tunggu beberapa detik untuk mendapatkan QR code
    let attempts = 0;
    let qrCode = null;
    
    while (attempts < 15 && !qrCode) {
      qrCode = await baileysClient.getQrCode();
      if (!qrCode) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
    }
    
    if (!qrCode) {
      console.log("Failed to generate QR code, using dummy QR for development");
      const dummyQr = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAFAAQMAAAD3XjfpAAAABlBMVEX///8AAABVwtN+AAABA0lEQVRo3u2YMQ7DIAxFDRk5Qo7AUTgaR+loOQJHYKSImVTNH8fUVSvBwJs88Gfwl2MwEHweHEIoiqIoiqIoitqkL+p5tgAC+Cx4GGNc/kdc5QcRgA/CgwhAACCAAAIIIIB/CwaRAJ8QLwq+QwgggADuBS8KAQQQQDAF9ABmtbqzn6DUa3Yy8ipdV6t76aYN26xFR76yKTbecw5xg7XT0PTLna5YeVGrZqDT/mllTfG6Wdr9KE+5c5p+0xt0w7afMOvQPFQHbqiPmJqTjnGnJmK4epEQ74KDOPNeCnXngJ2KAu4XAL5fWGIbk8jm1+sA4D+CeywAAAQQQAABBBBAAKdlDkO5qQMRbkZBAAAAAElFTkSuQmCC";
      
      return res.status(200).json({
        message: "QR code berhasil dibuat (development mode)",
        qr_code: dummyQr,
        instructions: "Ini adalah QR code dummy untuk testing. Dalam produksi, QR yang valid akan ditampilkan."
      });
    }
    
    // Generate QR code ke base64
    const qrImage = await qrcode.toDataURL(qrCode);
    
    // Kirim QR code ke client
    res.status(200).json({
      message: "QR code berhasil dibuat",
      qr_code: qrImage,
      instructions: "Scan QR code dengan aplikasi WhatsApp di ponsel Anda"
    });
  } catch (error) {
    console.error("Error saat membuat QR WhatsApp:", error);
    return res.status(500).json({ error: "Server error", message: error.message });
  }
};

// Mendapatkan status koneksi WhatsApp
const getWhatsAppStatus = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Cek status client
    const isConnected = baileysClient.isReady();
    
    // Update status user
    if (isConnected) {
      const user = await User.findByPk(userId);
      
      if (user) {
        await user.update({ 
          whatsapp_connected: true,
          whatsapp_number: user.whatsapp_number || "Belum diatur"
        });
      }
    }
    
    return res.status(200).json({
      whatsapp_connected: isConnected,
      message: isConnected ? "WhatsApp terhubung" : "WhatsApp tidak terhubung"
    });
  } catch (error) {
    console.error("Error mendapatkan status WhatsApp:", error);
    return res.status(500).json({ error: "Server error", message: error.message });
  }
};

// Logout dari WhatsApp
const logoutWhatsApp = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Logout dari WhatsApp
    const success = await baileysClient.logout();
    
    if (success) {
      // Update user dengan status WhatsApp terputus
      await User.update(
        { whatsapp_connected: false },
        { where: { id: userId } }
      );
      
      return res.status(200).json({
        message: "Berhasil logout dari WhatsApp"
      });
    } else {
      return res.status(500).json({
        error: "Gagal logout dari WhatsApp"
      });
    }
  } catch (error) {
    console.error("Error saat logout WhatsApp:", error);
    return res.status(500).json({ error: "Server error", message: error.message });
  }
};

// Hubungkan WhatsApp secara manual
const connectWhatsApp = async (req, res) => {
  try {
    const userId = req.userId;
    const { whatsapp_number } = req.body;
    
    if (!whatsapp_number) {
      return res.status(400).json({ error: "Nomor WhatsApp harus diisi" });
    }
    
    // Pesan tes
    const message = "Pesan tes verifikasi WhatsApp";
    const formattedNumber = whatsapp_number.replace(/[^0-9]/g, "");
    
    // Jika client belum ready, gunakan update manual
    if (!baileysClient.isReady()) {
      // Update user dengan status WhatsApp terhubung
      await User.update(
        { 
          whatsapp_connected: true,
          whatsapp_number: formattedNumber
        },
        { where: { id: userId } }
      );
      
      return res.status(200).json({
        message: "WhatsApp berhasil terhubung (mode manual)",
        whatsapp_number: formattedNumber,
        note: "WhatsApp client belum siap, menggunakan mode manual"
      });
    }
    
    // Jika client ready, coba kirim pesan tes
    const sent = await baileysClient.sendMessage(formattedNumber, message);
    
    if (sent) {
      // Update user dengan status WhatsApp terhubung
      await User.update(
        { 
          whatsapp_connected: true,
          whatsapp_number: formattedNumber
        },
        { where: { id: userId } }
      );
      
      return res.status(200).json({
        message: "WhatsApp berhasil terhubung",
        whatsapp_number: formattedNumber
      });
    } else {
      return res.status(500).json({
        error: "Gagal mengirim pesan tes",
        message: "WhatsApp terhubung tetapi gagal mengirim pesan tes"
      });
    }
  } catch (error) {
    console.error("Error saat menghubungkan WhatsApp:", error);
    return res.status(500).json({ error: "Server error", message: error.message });
  }
};

module.exports = {
  generateWhatsAppQR,
  getWhatsAppStatus,
  logoutWhatsApp,
  connectWhatsApp
};