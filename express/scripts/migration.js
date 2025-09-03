// express/scripts/migration.js
const sequelize = require('../config/database');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigrations() {
  console.log('Running database migrations...');
  
  try {
    // Hubungkan ke database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });
    
    // Coba ubah tipe data kolom qris_image di tabel QrisSettings
    try {
      console.log('Altering QrisSettings table...');
      await connection.execute(
        'ALTER TABLE `QrisSettings` MODIFY `qris_image` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci'
      );
      console.log('Successfully altered QrisSettings table');
    } catch (error) {
      console.error('Error altering QrisSettings table:', error.message);
    }
    
    // Coba ubah tipe data kolom notification_template di tabel WhatsAppGroupSettings
    try {
      console.log('Altering WhatsAppGroupSettings table...');
      await connection.execute(
        'ALTER TABLE `WhatsAppGroupSettings` MODIFY `notification_template` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci'
      );
      console.log('Successfully altered WhatsAppGroupSettings table');
    } catch (error) {
      console.error('Error altering WhatsAppGroupSettings table:', error.message);
    }
    
    // Coba ubah tipe data kolom payment_proof di tabel QrisPayments
    try {
      console.log('Altering QrisPayments table...');
      await connection.execute(
        'ALTER TABLE `QrisPayments` MODIFY `payment_proof` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci'
      );
      console.log('Successfully altered QrisPayments table');
    } catch (error) {
      console.error('Error altering QrisPayments table:', error.message);
    }
    
    // Tutup koneksi
    await connection.end();
    console.log('Database migrations completed');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Jalankan migrasi
runMigrations();