"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("Transactions", { cascade: true });
    await queryInterface.dropTable("PaymentMethods", { cascade: true });
    
    // Hapus kolom terkait pembayaran dari tabel Subscriptions
    await queryInterface.removeColumn("Subscriptions", "payment_status");
    await queryInterface.removeColumn("Subscriptions", "payment_method");
    await queryInterface.removeColumn("Subscriptions", "tripay_reference");
    await queryInterface.removeColumn("Subscriptions", "tripay_merchant_ref");
  },

  down: async (queryInterface, Sequelize) => {
    // Kode untuk membuat kembali tabel dan kolom yang dihapus jika perlu
  }
};