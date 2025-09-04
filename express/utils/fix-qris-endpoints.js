// express/utils/fix-qris-endpoints.js
const { QrisSettings, QrisPayment, SubscriptionPlan } = require("../models");

const ensureQrisTables = async () => {
  try {
    // Coba akses tabel untuk memastikan sudah ada
    await QrisSettings.findOne();
    
    console.log("✅ Tabel QrisSettings sudah tersedia");
    
    // Pastikan ada minimal 1 data
    const count = await QrisSettings.count();
    if (count === 0) {
      await QrisSettings.create({
        merchant_name: "Kinterstore",
        qris_image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAFAAQMAAAD3XjfpAAAABlBMVEX///8AAABVwtN+AAABA0lEQVRo3u2YMQ7DIAxFDRk5Qo7AUTgaR+loOQJHYKSImVTNH8fUVSvBwJs88Gfwl2MwEHweHEIoiqIoiqIoitqkL+p5tgAC+Cx4GGNc/kdc5QcRgA/CgwhAACCAAAIIIIB/CwaRAJ8QLwq+QwgggADuBS8KAQQQQDAF9ABmtbqzn6DUa3Yy8ipdV6t76aYN26xFR76yKTbecw5xg7XT0PTLna5YeVGrZqDT/mllTfG6Wdr9KE+5c5p+0xt0w7afMOvQPFQHbqiPmJqTjnGnJmK4epEQ74KDOPNeCnXngJ2KAu4XAL5fWGIbk8jm1+sA4D+CeywAAAQQQAABBBBAAKdlDkO5qQMRbkZBAAAAAElFTkSuQmCC",
        is_active: true,
        expiry_hours: 24,
        instructions: "Scan kode QR menggunakan aplikasi e-wallet atau mobile banking Anda."
      });
      console.log("✅ Data default QrisSettings berhasil dibuat");
    }
    
    // Lakukan hal yang sama untuk tabel WhatsAppGroupSettings
    try {
      const { WhatsAppGroupSettings } = require("../models");
      await WhatsAppGroupSettings.findOne();
      
      console.log("✅ Tabel WhatsAppGroupSettings sudah tersedia");
      
      const groupCount = await WhatsAppGroupSettings.count();
      if (groupCount === 0) {
        await WhatsAppGroupSettings.create({
          group_name: "Verifikasi Pembayaran",
          group_id: "",
          is_active: true,
          notification_template: "Cek status pembayaran username: {username} untuk paket {plan_name} dengan nominal Rp {amount}"
        });
        console.log("✅ Data default WhatsAppGroupSettings berhasil dibuat");
      }
    } catch (whatsappError) {
      console.error("❌ Error saat mengakses tabel WhatsAppGroupSettings:", whatsappError);
    }
    
    return true;
  } catch (error) {
    console.error("❌ Error saat mengakses tabel QrisSettings:", error);
    
    // Coba buat tabel jika belum ada
    try {
      // Gunakan sequelize.query untuk membuat tabel secara manual jika diperlukan
      const sequelize = require("../config/database");
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS QrisSettings (
          id int(11) NOT NULL AUTO_INCREMENT,
          merchant_name varchar(255) NOT NULL DEFAULT 'Kinterstore',
          qris_image text DEFAULT NULL,
          is_active tinyint(1) NOT NULL DEFAULT 1,
          expiry_hours int(11) NOT NULL DEFAULT 24,
          instructions text DEFAULT NULL,
          createdAt datetime NOT NULL DEFAULT current_timestamp(),
          updatedAt datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
      `);
      
      // Coba buat QrisSettings default jika belum ada
      await QrisSettings.create({
        merchant_name: "Kinterstore",
        qris_image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAFAAQMAAAD3XjfpAAAABlBMVEX///8AAABVwtN+AAABA0lEQVRo3u2YMQ7DIAxFDRk5Qo7AUTgaR+loOQJHYKSImVTNH8fUVSvBwJs88Gfwl2MwEHweHEIoiqIoiqIoitqkL+p5tgAC+Cx4GGNc/kdc5QcRgA/CgwhAACCAAAIIIIB/CwaRAJ8QLwq+QwgggADuBS8KAQQQQDAF9ABmtbqzn6DUa3Yy8ipdV6t76aYN26xFR76yKTbecw5xg7XT0PTLna5YeVGrZqDT/mllTfG6Wdr9KE+5c5p+0xt0w7afMOvQPFQHbqiPmJqTjnGnJmK4epEQ74KDOPNeCnXngJ2KAu4XAL5fWGIbk8jm1+sA4D+CeywAAAQQQAABBBBAAKdlDkO5qQMRbkZBAAAAAElFTkSuQmCC",
        is_active: true,
        expiry_hours: 24,
        instructions: "Scan kode QR menggunakan aplikasi e-wallet atau mobile banking Anda."
      });
      
      console.log("✅ QrisSettings default berhasil dibuat");
      
      // Coba buat tabel WhatsAppGroupSettings jika belum ada
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS WhatsAppGroupSettings (
          id int(11) NOT NULL AUTO_INCREMENT,
          group_name varchar(100) NOT NULL,
          group_id varchar(100) DEFAULT NULL,
          is_active tinyint(1) DEFAULT 1,
          notification_template text,
          createdAt datetime NOT NULL,
          updatedAt datetime NOT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
      `);
      
      console.log("✅ Tabel WhatsAppGroupSettings berhasil dibuat");
    } catch (createError) {
      console.error("❌ Gagal membuat tabel secara manual:", createError);
    }
    
    return false;
  }
};

module.exports = { ensureQrisTables };