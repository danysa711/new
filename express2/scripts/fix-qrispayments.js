// express/scripts/fix-qrispayments.js

const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixQrisPaymentsTable() {
  console.log('Memperbaiki tabel QrisPayments...');
  
  try {
    // Koneksi langsung ke database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });
    
    // Cek apakah kolom amount sudah ada
    const [columns] = await connection.execute(
      `SHOW COLUMNS FROM QrisPayments WHERE Field = 'amount'`
    );
    
    if (columns.length > 0) {
      // Jika kolom sudah ada dan merupakan generated column
      if (columns[0].Extra.includes('GENERATED')) {
        console.log('Menghapus kolom amount yang merupakan generated column...');
        await connection.execute(
          `ALTER TABLE QrisPayments DROP COLUMN amount`
        );
        console.log('Kolom amount berhasil dihapus');
        
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
    } else {
      // Jika kolom amount belum ada
      console.log('Membuat kolom amount baru...');
      await connection.execute(
        `ALTER TABLE QrisPayments ADD COLUMN amount DECIMAL(10,2) NOT NULL AFTER plan_id`
      );
      console.log('Kolom amount berhasil dibuat');
      
      // Update nilai kolom amount berdasarkan total_amount dan unique_code
      console.log('Mengupdate nilai kolom amount...');
      await connection.execute(
        `UPDATE QrisPayments SET amount = total_amount - (unique_code / 100)`
      );
      console.log('Nilai kolom amount berhasil diupdate');
    }
    
    console.log('Perbaikan tabel QrisPayments selesai');
    await connection.end();
    return true;
  } catch (error) {
    console.error('Error memperbaiki tabel QrisPayments:', error);
    return false;
  }
}

fixQrisPaymentsTable()
  .then(result => {
    if (result) {
      console.log('Script migrasi berhasil dijalankan');
    } else {
      console.log('Script migrasi gagal, periksa error di atas');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Error tak terduga:', err);
    process.exit(1);
  });