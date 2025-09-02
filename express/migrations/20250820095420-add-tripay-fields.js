"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Tambahkan kolom-kolom Tripay ke tabel Subscriptions
    await queryInterface.addColumn("Subscriptions", "tripay_reference", {
      type: Sequelize.STRING,
      allowNull: true,
    }).catch(error => {
      console.log("Kolom tripay_reference sudah ada di tabel Subscriptions atau error:", error.message);
    });
    
    await queryInterface.addColumn("Subscriptions", "tripay_merchant_ref", {
      type: Sequelize.STRING,
      allowNull: true,
    }).catch(error => {
      console.log("Kolom tripay_merchant_ref sudah ada di tabel Subscriptions atau error:", error.message);
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Subscriptions", "tripay_reference").catch(error => console.log(error.message));
    await queryInterface.removeColumn("Subscriptions", "tripay_merchant_ref").catch(error => console.log(error.message));
  },
};