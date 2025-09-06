'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Tambah kolom qris_image jika belum ada
    try {
      await queryInterface.addColumn('payment_settings', 'qris_image', {
        type: Sequelize.BLOB('long'),
        allowNull: true
      });
    } catch (error) {
      console.log('Column qris_image already exists or other error:', error.message);
    }
    
    // Hapus kolom yang tidak diperlukan
    try {
      await queryInterface.removeColumn('payment_settings', 'account_number');
    } catch (error) {
      console.log('Column account_number already removed or other error:', error.message);
    }
    
    try {
      await queryInterface.removeColumn('payment_settings', 'account_name');
    } catch (error) {
      console.log('Column account_name already removed or other error:', error.message);
    }
    
    try {
      await queryInterface.removeColumn('payment_settings', 'bank_name');
    } catch (error) {
      console.log('Column bank_name already removed or other error:', error.message);
    }
    
    try {
      await queryInterface.removeColumn('payment_settings', 'success_message_template');
    } catch (error) {
      console.log('Column success_message_template already removed or other error:', error.message);
    }
    
    try {
      await queryInterface.removeColumn('payment_settings', 'rejected_message_template');
    } catch (error) {
      console.log('Column rejected_message_template already removed or other error:', error.message);
    }
    
    // Ubah template verifikasi ke versi baru
    try {
      await queryInterface.sequelize.query(`
        UPDATE payment_settings
        SET verification_message_template = '*VERIFIKASI PEMBAYARAN BARU KE GRUP*\n    \nNama: {username}\nEmail: {email}\nID Transaksi: {transaction_id}\nPaket: {plan_name}\nDurasi: {duration} hari\nNominal: Rp {price}\nWaktu: {datetime}\n\nBalas pesan ini dengan angka:\n*1* untuk *VERIFIKASI*\n*2* untuk *TOLAK*'
      `);
    } catch (error) {
      console.log('Error updating verification_message_template or table empty:', error.message);
    }
  },

  async down(queryInterface, Sequelize) {
    // Kembalikan kolom yang dihapus
    try {
      await queryInterface.addColumn('payment_settings', 'account_number', {
        type: Sequelize.STRING(100),
        allowNull: true
      });
    } catch (error) {
      console.log('Error adding account_number column:', error.message);
    }
    
    try {
      await queryInterface.addColumn('payment_settings', 'account_name', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
    } catch (error) {
      console.log('Error adding account_name column:', error.message);
    }
    
    try {
      await queryInterface.addColumn('payment_settings', 'bank_name', {
        type: Sequelize.STRING(100),
        allowNull: true
      });
    } catch (error) {
      console.log('Error adding bank_name column:', error.message);
    }
    
    try {
      await queryInterface.addColumn('payment_settings', 'success_message_template', {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: `Halo {username},
           
    Pembayaran Anda untuk paket *{plan_name}* telah *DIVERIFIKASI*.

    Langganan Anda telah aktif dan akan berlaku hingga *{end_date}*.

    Terima kasih telah berlangganan!`
      });
    } catch (error) {
      console.log('Error adding success_message_template column:', error.message);
    }
    
    try {
      await queryInterface.addColumn('payment_settings', 'rejected_message_template', {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: `Halo {username},
           
    Maaf, pembayaran Anda untuk paket *{plan_name}* telah *DITOLAK*.

    Silakan coba lagi atau hubungi admin untuk informasi lebih lanjut.`
      });
    } catch (error) {
      console.log('Error adding rejected_message_template column:', error.message);
    }
    
    // Hapus kolom qris_image
    try {
      await queryInterface.removeColumn('payment_settings', 'qris_image');
    } catch (error) {
      console.log('Error removing qris_image column:', error.message);
    }
    
    // Kembalikan template verifikasi ke versi lama
    try {
      await queryInterface.sequelize.query(`
        UPDATE payment_settings
        SET verification_message_template = '*VERIFIKASI PEMBAYARAN BARU*\n    \nNama: {username}\nEmail: {email}\nID Transaksi: {transaction_id}\nPaket: {plan_name}\nDurasi: {duration} hari\nNominal: Rp {price}\nWaktu: {datetime}\n\nBalas pesan ini dengan angka:\n*1* untuk *VERIFIKASI*\n*2* untuk *TOLAK*'
      `);
    } catch (error) {
      console.log('Error reverting verification_message_template:', error.message);
    }
  }
};