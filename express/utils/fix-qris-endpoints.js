// express/utils/fix-qris-endpoints.js
const { QrisSettings, QrisPayment, db } = require("../models");

const ensureQrisTables = async () => {
  try {
    console.log("Memastikan tabel QRIS tersedia...");
    
    // Buat tabel secara manual jika belum ada
    const sequelize = db.sequelize;
    
    // 1. Buat tabel QrisSettings
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS QrisSettings (
        id int(11) NOT NULL AUTO_INCREMENT,
        merchant_name varchar(255) NOT NULL DEFAULT 'Kinterstore',
        qris_image text DEFAULT NULL,
        is_active tinyint(1) NOT NULL DEFAULT 1,
        expiry_hours int(11) NOT NULL DEFAULT 24,
        instructions text DEFAULT NULL,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
    `);
    
    console.log("✅ Tabel QrisSettings dibuat/diperiksa");
    
    // 2. Buat tabel QrisPayment
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS QrisPayment (
        id int(11) NOT NULL AUTO_INCREMENT,
        reference varchar(255) NOT NULL,
        user_id int(11) NOT NULL,
        plan_id int(11) NOT NULL,
        amount decimal(10,2) NOT NULL,
        unique_code int(11) NOT NULL,
        total_amount decimal(10,2) NOT NULL,
        status enum('UNPAID','PAID','REJECTED','EXPIRED','PENDING_VERIFICATION') NOT NULL DEFAULT 'UNPAID',
        payment_proof longtext DEFAULT NULL,
        whatsapp_notification_sent tinyint(1) DEFAULT 0,
        whatsapp_verification enum('PENDING','VERIFIED','REJECTED') DEFAULT NULL,
        verification_note text DEFAULT NULL,
        expired_at datetime NOT NULL,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY reference (reference)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
    `);
    
    console.log("✅ Tabel QrisPayment dibuat/diperiksa");
    
    // 3. Buat tabel WhatsAppGroupSettings
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS WhatsAppGroupSettings (
        id int(11) NOT NULL AUTO_INCREMENT,
        group_name varchar(100) NOT NULL,
        group_id varchar(100) DEFAULT NULL,
        is_active tinyint(1) DEFAULT 1,
        notification_template text DEFAULT NULL,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
    `);
    
    console.log("✅ Tabel WhatsAppGroupSettings dibuat/diperiksa");
    
    // 4. Periksa apakah ada data di tabel QrisSettings, jika tidak buat data default
    try {
      const settingsCount = await QrisSettings.count();
      
      if (settingsCount === 0) {
        console.log("Membuat data default untuk QrisSettings...");
        
        await QrisSettings.create({
          merchant_name: "Kinterstore",
          qris_image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAFAAQMAAAD3XjfpAAAABlBMVEX///8AAABVwtN+AAABA0lEQVRo3u2YMQ7DIAxFDRk5Qo7AUTgaR+loOQJHYKSImVTNH8fUVSvBwJs88Gfwl2MwEHweHEIoiqIoiqIoitqkL+p5tgAC+Cx4GGNc/kdc5QcRgA/CgwhAACCAAAIIIIB/CwaRAJ8QLwq+QwgggADuBS8KAQQQQDAF9ABmtbqzn6DUa3Yy8ipdV6t76aYN26xFR76yKTbecw5xg7XT0PTLna5YeVGrZqDT/mllTfG6Wdr9KE+5c5p+0xt0w7afMOvQPFQHbqiPmJqTjnGnJmK4epEQ74KDOPNeCnXngJ2KAu4XAL5fWGIbk8jm1+sA4D+CeywAAAQQQAABBBBAAKdlDkO5qQMRbkZBAAAAAElFTkSuQmCC",
          is_active: true,
          expiry_hours: 24,
          instructions: "Scan kode QR menggunakan aplikasi e-wallet atau mobile banking Anda."
        });
        
        console.log("✅ Data default QrisSettings berhasil dibuat");
      }
    } catch (err) {
      console.error("Error checking or creating default QrisSettings:", err);
      
      // Jika error saat membuat dengan model, coba dengan SQL langsung
      await sequelize.query(`
        INSERT INTO QrisSettings (merchant_name, qris_image, is_active, expiry_hours, instructions)
        SELECT 'Kinterstore', 
               'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAFAAQMAAAD3XjfpAAAABlBMVEX///8AAABVwtN+AAABA0lEQVRo3u2YMQ7DIAxFDRk5Qo7AUTgaR+loOQJHYKSImVTNH8fUVSvBwJs88Gfwl2MwEHweHEIoiqIoiqIoitqkL+p5tgAC+Cx4GGNc/kdc5QcRgA/CgwhAACCAAAIIIIB/CwaRAJ8QLwq+QwgggADuBS8KAQQQQDAF9ABmtbqzn6DUa3Yy8ipdV6t76aYN26xFR76yKTbecw5xg7XT0PTLna5YeVGrZqDT/mllTfG6Wdr9KE+5c5p+0xt0w7afMOvQPFQHbqiPmJqTjnGnJmK4epEQ74KDOPNeCnXngJ2KAu4XAL5fWGIbk8jm1+sA4D+CeywAAAQQQAABBBBAAKdlDkO5qQMRbkZBAAAAAElFTkSuQmCC', 
               1, 
               24, 
               'Scan kode QR menggunakan aplikasi e-wallet atau mobile banking Anda.'
        FROM dual
        WHERE NOT EXISTS (SELECT * FROM QrisSettings LIMIT 1)
      `);
      
      console.log("✅ Data default QrisSettings berhasil dibuat dengan SQL");
    }
    
    // 5. Periksa juga WhatsAppGroupSettings
    try {
      const groupSettingsCount = await sequelize.query(
        "SELECT COUNT(*) as count FROM WhatsAppGroupSettings", 
        { type: db.Sequelize.QueryTypes.SELECT }
      );
      
      if (groupSettingsCount[0].count === 0) {
        console.log("Membuat data default untuk WhatsAppGroupSettings...");
        
        await sequelize.query(`
          INSERT INTO WhatsAppGroupSettings (group_name, group_id, is_active, notification_template)
          VALUES (
            'Verifikasi Pembayaran',
            '',
            1,
            'Cek status pembayaran username: {username} untuk paket {plan_name} dengan nominal Rp {amount}'
          )
        `);
        
        console.log("✅ Data default WhatsAppGroupSettings berhasil dibuat");
      }
    } catch (err) {
      console.error("Error checking or creating default WhatsAppGroupSettings:", err);
    }
    
    console.log("✅ Semua tabel QRIS berhasil diperiksa dan dibuat jika diperlukan");
    return true;
  } catch (error) {
    console.error("❌ Error saat memastikan tabel QRIS tersedia:", error);
    return false;
  }
};

module.exports = { ensureQrisTables };