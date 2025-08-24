// File: express/controllers/settingsController.js
const fs = require('fs');
const path = require('path');

// Path untuk file konfigurasi
const configFilePath = path.join(__dirname, '../config/app_settings.json');

// Fungsi untuk memuat pengaturan
const loadSettings = () => {
  try {
    if (fs.existsSync(configFilePath)) {
      const data = fs.readFileSync(configFilePath, 'utf8');
      return JSON.parse(data);
    }
    
    // Default settings jika file tidak ada
    const defaultSettings = {
      whatsapp: {
        phone: "6281234567890",
        message: "Halo, saya {username} ({email}) ingin {purpose}. URL Slug: {url_slug}"
      },
      company: {
        name: "Kinterstore",
        address: "Jakarta, Indonesia",
        email: "info@kinterstore.my.id"
      }
    };

    // Path untuk file konfigurasi
const configFilePath = path.join(__dirname, '../config/app_settings.json');

// Fungsi untuk memuat pengaturan
const loadSettings = () => {
  try {
    if (fs.existsSync(configFilePath)) {
      const data = fs.readFileSync(configFilePath, 'utf8');
      return JSON.parse(data);
    }
    
    // Default settings jika file tidak ada
    const defaultSettings = {
      whatsapp: {
        phone: "6281234567890",
        message: "Halo, saya {username} ({email}) ingin {purpose}. URL Slug: {url_slug}"
      },
      company: {
        name: "Kinterstore",
        address: "Jakarta, Indonesia",
        email: "info@kinterstore.my.id"
      }
    };
    
    // Buat file jika tidak ada
    fs.writeFileSync(configFilePath, JSON.stringify(defaultSettings, null, 2));
    return defaultSettings;
  } catch (error) {
    console.error("Error loading settings:", error);
    return {
      whatsapp: {
        phone: "6281234567890",
        message: "Halo, saya {username} ({email}) ingin {purpose}. URL Slug: {url_slug}"
      }
    };
  }
};
    
    // Buat file jika tidak ada
    fs.writeFileSync(configFilePath, JSON.stringify(defaultSettings, null, 2));
    return defaultSettings;
  } catch (error) {
    console.error("Error loading settings:", error);
    return {
      whatsapp: {
        phone: "6281234567890",
        message: "Halo, saya {username} ({email}) ingin {purpose}. URL Slug: {url_slug}"
      }
    };
  }
};

// Fungsi untuk menyimpan pengaturan
const saveSettings = (settings) => {
  try {
    fs.writeFileSync(configFilePath, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error("Error saving settings:", error);
    return false;
  }
};

// Get all settings
const getSettings = (req, res) => {
  try {
    const settings = loadSettings();
    return res.status(200).json(settings);
  } catch (error) {
    console.error("Error getting settings:", error);
    return res.status(500).json({ error: "Terjadi kesalahan saat memuat pengaturan" });
  }
};

// Update WhatsApp settings
const updateWhatsAppSettings = (req, res) => {
  try {
    const { phone, message } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: "Nomor WhatsApp diperlukan" });
    }
    
    const settings = loadSettings();
    settings.whatsapp = {
      phone,
      message: message || settings.whatsapp.message
    };
    
    const saved = saveSettings(settings);
    
    if (saved) {
      return res.status(200).json({ message: "Pengaturan WhatsApp berhasil diperbarui", whatsapp: settings.whatsapp });
    } else {
      return res.status(500).json({ error: "Gagal menyimpan pengaturan" });
    }
  } catch (error) {
    console.error("Error updating WhatsApp settings:", error);
    return res.status(500).json({ error: "Terjadi kesalahan saat memperbarui pengaturan WhatsApp" });
  }
};

// Update company settings
const updateCompanySettings = (req, res) => {
  try {
    const { name, address, email } = req.body;
    
    const settings = loadSettings();
    settings.company = {
      name: name || settings.company.name,
      address: address || settings.company.address,
      email: email || settings.company.email
    };
    
    const saved = saveSettings(settings);
    
    if (saved) {
      return res.status(200).json({ message: "Pengaturan perusahaan berhasil diperbarui", company: settings.company });
    } else {
      return res.status(500).json({ error: "Gagal menyimpan pengaturan" });
    }
  } catch (error) {
    console.error("Error updating company settings:", error);
    return res.status(500).json({ error: "Terjadi kesalahan saat memperbarui pengaturan perusahaan" });
  }
};

module.exports = {
  getSettings,
  updateWhatsAppSettings,
  updateCompanySettings
};