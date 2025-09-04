// express/scripts/fix-all-issues.js

const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixAllIssues() {
  console.log('Menjalankan perbaikan semua masalah...');
  
  try {
    // Koneksi langsung ke database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || 'Danysa711@@@',
      database: process.env.DB_NAME || 'db_shopee_bot'
    });
    
    console.log('Berhasil terhubung ke database');
    
    // 1. Perbaiki tabel QrisPayments
    try {
      // Cek apakah tabel QrisPayments sudah ada
      const [tables] = await connection.execute(
        `SHOW TABLES LIKE 'QrisPayments'`
      );
      
      if (tables.length === 0) {
        console.log('Tabel QrisPayments belum ada, membuat tabel baru...');
        await connection.execute(`
          CREATE TABLE QrisPayments (
            id int(11) NOT NULL AUTO_INCREMENT,
            reference varchar(255) NOT NULL,
            user_id int(11) NOT NULL,
            plan_id int(11) NOT NULL,
            amount decimal(10,2) NOT NULL,
            unique_code int(11) NOT NULL,
            total_amount decimal(10,2) NOT NULL,
            status enum('UNPAID','PAID','REJECTED','EXPIRED','PENDING_VERIFICATION') DEFAULT 'UNPAID',
            payment_proof longtext,
            whatsapp_notification_sent tinyint(1) DEFAULT '0',
            whatsapp_verification enum('PENDING','VERIFIED','REJECTED') DEFAULT NULL,
            verification_note text,
            expired_at datetime NOT NULL,
            createdAt datetime NOT NULL DEFAULT current_timestamp,
            updatedAt datetime NOT NULL DEFAULT current_timestamp ON UPDATE current_timestamp,
            PRIMARY KEY (id),
            UNIQUE KEY reference (reference)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
        `);
        console.log('Tabel QrisPayments berhasil dibuat');
      } else {
        // Perbaiki kolom-kolom yang mungkin kurang
        console.log('Tabel QrisPayments sudah ada, memeriksa struktur...');
        
        // Cek kolom verification_note
        const [verificationNoteCol] = await connection.execute(
          `SHOW COLUMNS FROM QrisPayments LIKE 'verification_note'`
        );
        
        if (verificationNoteCol.length === 0) {
          console.log('Menambahkan kolom verification_note...');
          await connection.execute(
            `ALTER TABLE QrisPayments ADD COLUMN verification_note text AFTER whatsapp_verification`
          );
          console.log('Kolom verification_note berhasil ditambahkan');
        } else {
          console.log('Kolom verification_note sudah ada');
        }
        
        // Cek kolom whatsapp_verification
        const [whatsappVerificationCol] = await connection.execute(
          `SHOW COLUMNS FROM QrisPayments LIKE 'whatsapp_verification'`
        );
        
        if (whatsappVerificationCol.length === 0) {
          console.log('Menambahkan kolom whatsapp_verification...');
          await connection.execute(
            `ALTER TABLE QrisPayments ADD COLUMN whatsapp_verification enum('PENDING','VERIFIED','REJECTED') DEFAULT NULL AFTER whatsapp_notification_sent`
          );
          console.log('Kolom whatsapp_verification berhasil ditambahkan');
        } else {
          console.log('Kolom whatsapp_verification sudah ada');
        }
        
        // Perbaiki enum pada kolom status
        const [statusCol] = await connection.execute(
          `SHOW COLUMNS FROM QrisPayments WHERE Field = 'status'`
        );
        
        if (statusCol.length > 0) {
          const statusType = statusCol[0].Type;
          if (!statusType.includes('PENDING_VERIFICATION')) {
            console.log('Memperbarui enum values untuk kolom status...');
            await connection.execute(
              `ALTER TABLE QrisPayments MODIFY COLUMN status enum('UNPAID','PAID','REJECTED','EXPIRED','PENDING_VERIFICATION') DEFAULT 'UNPAID'`
            );
            console.log('Enum values status berhasil diperbarui');
          }
        }
        
        // Perbaiki kolom payment_proof menjadi LONGTEXT
        const [paymentProofCol] = await connection.execute(
          `SHOW COLUMNS FROM QrisPayments WHERE Field = 'payment_proof'`
        );
        
        if (paymentProofCol.length > 0 && !paymentProofCol[0].Type.includes('longtext')) {
          console.log('Mengubah tipe data payment_proof menjadi LONGTEXT...');
          await connection.execute(
            `ALTER TABLE QrisPayments MODIFY COLUMN payment_proof LONGTEXT`
          );
          console.log('Tipe data payment_proof berhasil diubah');
        }
      }
    } catch (qrisPaymentError) {
      console.error('Error saat memperbaiki tabel QrisPayments:', qrisPaymentError);
    }
    
    // 2. Perbaiki tabel QrisSettings
    try {
      // Cek apakah tabel QrisSettings sudah ada
      const [tables] = await connection.execute(
        `SHOW TABLES LIKE 'QrisSettings'`
      );
      
      if (tables.length === 0) {
        console.log('Tabel QrisSettings belum ada, membuat tabel baru...');
        await connection.execute(`
          CREATE TABLE QrisSettings (
            id int(11) NOT NULL AUTO_INCREMENT,
            merchant_name varchar(255) NOT NULL DEFAULT 'Kinterstore',
            qris_image longtext,
            is_active tinyint(1) NOT NULL DEFAULT 1,
            expiry_hours int(11) NOT NULL DEFAULT 24,
            instructions text,
            createdAt datetime NOT NULL DEFAULT current_timestamp,
            updatedAt datetime NOT NULL DEFAULT current_timestamp ON UPDATE current_timestamp,
            PRIMARY KEY (id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
        `);
        console.log('Tabel QrisSettings berhasil dibuat');
        
        // Tambahkan data default
        await connection.execute(`
          INSERT INTO QrisSettings (merchant_name, qris_image, is_active, expiry_hours, instructions)
          VALUES (
            'Kinterstore', 
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAFAAQMAAAD3XjfpAAAABlBMVEX///8AAABVwtN+AAABA0lEQVRo3u2YMQ7DIAxFDRk5Qo7AUTgaR+loOQJHYKSImVTNH8fUVSvBwJs88Gfwl2MwEHweHEIoiqIoiqIoitqkL+p5tgAC+Cx4GGNc/kdc5QcRgA/CgwhAACCAAAIIIIB/CwaRAJ8QLwq+QwgggADuBS8KAQQQQDAF9ABmtbqzn6DUa3Yy8ipdV6t76aYN26xFR76yKTbecw5xg7XT0PTLna5YeVGrZqDT/mllTfG6Wdr9KE+5c5p+0xt0w7afMOvQPFQHbqiPmJqTjnGnJmK4epEQ74KDOPNeCnXngJ2KAu4XAL5fWGIbk8jm1+sA4D+CeywAAAQQQAABBBBAAKdlDkO5qQMRbkZBAAAAAElFTkSuQmCC',
            1,
            24,
            'Scan kode QR menggunakan aplikasi e-wallet atau mobile banking Anda.'
          )
        `);
        console.log('Data default QrisSettings berhasil ditambahkan');
      } else {
        // Perbaiki kolom-kolom yang mungkin kurang
        console.log('Tabel QrisSettings sudah ada, memeriksa struktur...');
        
        // Perbaiki tipe data qris_image menjadi LONGTEXT
        const [qrisImageCol] = await connection.execute(
          `SHOW COLUMNS FROM QrisSettings WHERE Field = 'qris_image'`
        );
        
        if (qrisImageCol.length > 0 && !qrisImageCol[0].Type.includes('longtext')) {
          console.log('Mengubah tipe data qris_image menjadi LONGTEXT...');
          await connection.execute(
            `ALTER TABLE QrisSettings MODIFY COLUMN qris_image LONGTEXT`
          );
          console.log('Tipe data qris_image berhasil diubah');
        }
        
        // Cek apakah ada data dalam QrisSettings
        const [qrisSettingsData] = await connection.execute(
          `SELECT COUNT(*) AS count FROM QrisSettings`
        );
        
        if (qrisSettingsData[0].count === 0) {
          console.log('Tabel QrisSettings kosong, menambahkan data default...');
          await connection.execute(`
            INSERT INTO QrisSettings (merchant_name, qris_image, is_active, expiry_hours, instructions)
            VALUES (
              'Kinterstore', 
              'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAFAAQMAAAD3XjfpAAAABlBMVEX///8AAABVwtN+AAABA0lEQVRo3u2YMQ7DIAxFDRk5Qo7AUTgaR+loOQJHYKSImVTNH8fUVSvBwJs88Gfwl2MwEHweHEIoiqIoiqIoitqkL+p5tgAC+Cx4GGNc/kdc5QcRgA/CgwhAACCAAAIIIIB/CwaRAJ8QLwq+QwgggADuBS8KAQQQQDAF9ABmtbqzn6DUa3Yy8ipdV6t76aYN26xFR76yKTbecw5xg7XT0PTLna5YeVGrZqDT/mllTfG6Wdr9KE+5c5p+0xt0w7afMOvQPFQHbqiPmJqTjnGnJmK4epEQ74KDOPNeCnXngJ2KAu4XAL5fWGIbk8jm1+sA4D+CeywAAAQQQAABBBBAAKdlDkO5qQMRbkZBAAAAAElFTkSuQmCC',
              1,
              24,
              'Scan kode QR menggunakan aplikasi e-wallet atau mobile banking Anda.'
            )
          `);
          console.log('Data default QrisSettings berhasil ditambahkan');
        }
      }
    } catch (qrisSettingsError) {
      console.error('Error saat memperbaiki tabel QrisSettings:', qrisSettingsError);
    }
    
    // 3. Perbaiki tabel WhatsAppGroupSettings
    try {
      // Cek apakah tabel WhatsAppGroupSettings sudah ada
      const [tables] = await connection.execute(
        `SHOW TABLES LIKE 'WhatsAppGroupSettings'`
      );
      
      if (tables.length === 0) {
        console.log('Tabel WhatsAppGroupSettings belum ada, membuat tabel baru...');
        await connection.execute(`
          CREATE TABLE WhatsAppGroupSettings (
            id int(11) NOT NULL AUTO_INCREMENT,
            group_name varchar(100) NOT NULL,
            group_id varchar(100) DEFAULT NULL,
            is_active tinyint(1) DEFAULT 1,
            notification_template text,
            createdAt datetime NOT NULL DEFAULT current_timestamp,
            updatedAt datetime NOT NULL DEFAULT current_timestamp ON UPDATE current_timestamp,
            PRIMARY KEY (id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
        `);
        console.log('Tabel WhatsAppGroupSettings berhasil dibuat');
        
        // Tambahkan data default
        await connection.execute(`
          INSERT INTO WhatsAppGroupSettings (group_name, group_id, is_active, notification_template)
          VALUES (
            'Verifikasi Pembayaran',
            '',
            1,
            'Cek status pembayaran username: {username} untuk paket {plan_name} dengan nominal Rp {amount}'
          )
        `);
        console.log('Data default WhatsAppGroupSettings berhasil ditambahkan');
      } else {
        // Cek apakah ada data dalam WhatsAppGroupSettings
        const [whatsappData] = await connection.execute(
          `SELECT COUNT(*) AS count FROM WhatsAppGroupSettings`
        );
        
        if (whatsappData[0].count === 0) {
          console.log('Tabel WhatsAppGroupSettings kosong, menambahkan data default...');
          await connection.execute(`
            INSERT INTO WhatsAppGroupSettings (group_name, group_id, is_active, notification_template)
            VALUES (
              'Verifikasi Pembayaran',
              '',
              1,
              'Cek status pembayaran username: {username} untuk paket {plan_name} dengan nominal Rp {amount}'
            )
          `);
          console.log('Data default WhatsAppGroupSettings berhasil ditambahkan');
        }
      }
    } catch (whatsappError) {
      console.error('Error saat memperbaiki tabel WhatsAppGroupSettings:', whatsappError);
    }
    
    console.log('Perbaikan selesai');
    await connection.end();
  } catch (error) {
    console.error('Error saat menjalankan perbaikan:', error);
  }
}

fixAllIssues()
  .then(() => {
    console.log('Script perbaikan berhasil dijalankan');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error tak terduga:', err);
    process.exit(1);
  });