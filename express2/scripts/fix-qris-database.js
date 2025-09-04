// express/scripts/fix-qris-database.js

const mysql = require('mysql2/promise');
require('dotenv').config();
const { Sequelize } = require('sequelize');

async function fixQrisPaymentTable() {
  console.log('Memperbaiki tabel QrisPayments...');
  
  try {
    // Koneksi langsung ke database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || 'Danysa711@@@',
      database: process.env.DB_NAME || 'db_shopee_bot'
    });
    
    console.log('Berhasil terhubung ke database');
    
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
          createdAt datetime NOT NULL,
          updatedAt datetime NOT NULL,
          PRIMARY KEY (id),
          UNIQUE KEY reference (reference)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
      `);
      console.log('Tabel QrisPayments berhasil dibuat');
    } else {
      // Cek struktur tabel QrisPayments
      console.log('Tabel QrisPayments sudah ada, memeriksa struktur...');
      
      // Cek kolom amount
      const [columns] = await connection.execute(
        `SHOW COLUMNS FROM QrisPayments WHERE Field = 'amount'`
      );
      
      if (columns.length === 0) {
        // Jika kolom amount belum ada, tambahkan
        console.log('Membuat ulang kolom amount sebagai DECIMAL biasa...');
        await connection.execute(
          `ALTER TABLE QrisPayments ADD COLUMN amount DECIMAL(10,2) NOT NULL AFTER plan_id`
        );
        console.log('Kolom amount berhasil dibuat ulang');
        
        // Update nilai kolom amount berdasarkan total_amount dan unique_code
        console.log('Mengupdate nilai kolom amount...');
        await connection.execute(
          `UPDATE QrisPayments SET amount = total_amount - (unique_code / 100)`
        );
        console.log('Nilai kolom amount berhasil diupdate');
      } else {
        console.log('Kolom amount sudah benar, tidak perlu diubah');
      }
      
      // Periksa kolom status, pastikan mencakup PENDING_VERIFICATION
      const [statusColumn] = await connection.execute(
        `SHOW COLUMNS FROM QrisPayments WHERE Field = 'status'`
      );
      
      if (statusColumn.length > 0 && !statusColumn[0].Type.includes('PENDING_VERIFICATION')) {
        console.log('Memperbaiki kolom status untuk mendukung PENDING_VERIFICATION...');
        await connection.execute(
          `ALTER TABLE QrisPayments MODIFY COLUMN status enum('UNPAID','PAID','REJECTED','EXPIRED','PENDING_VERIFICATION') DEFAULT 'UNPAID'`
        );
        console.log('Kolom status berhasil diperbaiki');
      }
      
      // Periksa kolom payment_proof, pastikan menggunakan LONGTEXT
      const [proofColumn] = await connection.execute(
        `SHOW COLUMNS FROM QrisPayments WHERE Field = 'payment_proof'`
      );
      
      if (proofColumn.length > 0 && proofColumn[0].Type !== 'longtext') {
        console.log('Memperbaiki kolom payment_proof menjadi LONGTEXT...');
        await connection.execute(
          `ALTER TABLE QrisPayments MODIFY COLUMN payment_proof LONGTEXT`
        );
        console.log('Kolom payment_proof berhasil diperbaiki');
      }
    }
    
    console.log('Perbaikan tabel QrisPayments selesai');
    await connection.end();
    return true;
  } catch (error) {
    console.error('Error memperbaiki tabel QrisPayments:', error);
    return false;
  }
}

// Jalankan fungsi perbaikan
async function fixQrisPaymentTable() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'db_shopee_bot'
    });
    
    console.log('Berhasil terhubung ke database');
    
    // Cek apakah kolom verification_note sudah ada
    const [columns] = await connection.execute(
      `SHOW COLUMNS FROM QrisPayments LIKE 'verification_note'`
    );
    
    if (columns.length === 0) {
      console.log('Menambahkan kolom verification_note ke tabel QrisPayments...');
      await connection.execute(
        `ALTER TABLE QrisPayments ADD COLUMN verification_note TEXT NULL AFTER whatsapp_verification`
      );
      console.log('Kolom verification_note berhasil ditambahkan');
    } else {
      console.log('Kolom verification_note sudah ada');
    }
    
    // Pastikan juga kolom whatsapp_verification sudah ada
    const [whatsappCol] = await connection.execute(
      `SHOW COLUMNS FROM QrisPayments LIKE 'whatsapp_verification'`
    );
    
    if (whatsappCol.length === 0) {
      console.log('Menambahkan kolom whatsapp_verification ke tabel QrisPayments...');
      await connection.execute(
        `ALTER TABLE QrisPayments ADD COLUMN whatsapp_verification ENUM('PENDING','VERIFIED','REJECTED') NULL AFTER whatsapp_notification_sent`
      );
      console.log('Kolom whatsapp_verification berhasil ditambahkan');
    } else {
      console.log('Kolom whatsapp_verification sudah ada');
    }
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('Error memperbaiki tabel QrisPayments:', error);
    return false;
  }
}
        