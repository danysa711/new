// scripts/sync-db.js
const { db } = require('../models');

// Fungsi untuk sinkronisasi database
const syncDatabase = async () => {
  try {
    console.log('Menyinkronkan database...');
    
    // Sinkronkan semua model dengan database
    await db.sequelize.sync({ force: false });
    
    console.log('Database berhasil disinkronkan');
    
    // Tambahkan pengaturan default menggunakan raw query
    await addDefaultSettingsRaw();
    
    console.log('Proses selesai');
    process.exit(0);
  } catch (error) {
    console.error('Error sinkronisasi database:', error);
    process.exit(1);
  }
};

// Fungsi untuk menambahkan pengaturan default menggunakan raw query
const addDefaultSettingsRaw = async () => {
  try {
    console.log('Memeriksa dan menambahkan pengaturan default...');
    
    // Daftar pengaturan default
    const defaultSettings = [
      // Pengaturan Tripay
      { key: 'tripay_enabled', value: 'true' },
      { key: 'tripay_sandbox_mode', value: 'true' },
      { key: 'tripay_api_key', value: '' },
      { key: 'tripay_private_key', value: '' },
      { key: 'tripay_merchant_code', value: '' },
      
      // Pengaturan WhatsApp
      { key: 'support_whatsapp_number', value: '6281284712684' },
      { key: 'whatsapp_trial_enabled', value: 'true' },
      { key: 'whatsapp_trial_number', value: '6281284712684' },
      { key: 'whatsapp_trial_template', value: 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}' }
    ];
    
    // Periksa keberadaan tabel Settings
    try {
      const [tables] = await db.sequelize.query("SHOW TABLES LIKE 'Settings'");
      
      if (tables.length === 0) {
        console.error('Tabel Settings tidak ditemukan di database.');
        return;
      }
      
      console.log('Tabel Settings ditemukan, menambahkan pengaturan default...');
      
      // Periksa dan tambahkan pengaturan default jika belum ada
      for (const setting of defaultSettings) {
        // Cek apakah setting sudah ada
        const [existingSettings] = await db.sequelize.query(
          "SELECT * FROM `Settings` WHERE `key` = ?",
          {
            replacements: [setting.key],
            type: db.sequelize.QueryTypes.SELECT
          }
        );
        
        if (!existingSettings || existingSettings.length === 0) {
          // Tambahkan setting baru
          const now = new Date();
          await db.sequelize.query(
            "INSERT INTO `Settings` (`key`, `value`, `createdAt`, `updatedAt`) VALUES (?, ?, ?, ?)",
            {
              replacements: [setting.key, setting.value, now, now],
              type: db.sequelize.QueryTypes.INSERT
            }
          );
          console.log(`Pengaturan '${setting.key}' ditambahkan dengan nilai default`);
        } else {
          console.log(`Pengaturan '${setting.key}' sudah ada`);
        }
      }
      
      console.log('Pengaturan default berhasil diperiksa dan ditambahkan');
    } catch (error) {
      console.error('Error memeriksa tabel Settings:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error menambahkan pengaturan default:', error);
    throw error;
  }
};

// Jalankan fungsi
syncDatabase();