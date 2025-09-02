"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Tambahkan kolom user_id ke Software jika belum ada
    await queryInterface.addColumn("Software", "user_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
      onDelete: "SET NULL",
    }).catch(error => {
      console.log("Kolom user_id sudah ada di tabel Software atau error:", error.message);
    });
    
    // Tambahkan kolom user_id ke SoftwareVersions jika belum ada
    await queryInterface.addColumn("SoftwareVersions", "user_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
      onDelete: "SET NULL",
    }).catch(error => {
      console.log("Kolom user_id sudah ada di tabel SoftwareVersions atau error:", error.message);
    });
    
    // Tambahkan kolom user_id ke Licenses jika belum ada
    await queryInterface.addColumn("Licenses", "user_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
      onDelete: "SET NULL",
    }).catch(error => {
      console.log("Kolom user_id sudah ada di tabel Licenses atau error:", error.message);
    });
    
    // Tambahkan kolom user_id ke Orders jika belum ada
    await queryInterface.addColumn("Orders", "user_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
      onDelete: "SET NULL",
    }).catch(error => {
      console.log("Kolom user_id sudah ada di tabel Orders atau error:", error.message);
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Software", "user_id").catch(error => console.log(error.message));
    await queryInterface.removeColumn("SoftwareVersions", "user_id").catch(error => console.log(error.message));
    await queryInterface.removeColumn("Licenses", "user_id").catch(error => console.log(error.message));
    await queryInterface.removeColumn("Orders", "user_id").catch(error => console.log(error.message));
  },
};