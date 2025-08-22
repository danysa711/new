// Nama file: express/migrations/20250812000007-create-tripay-settings.js
"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("TripaySettings", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      api_key: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      private_key: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      merchant_code: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      is_sandbox: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("TripaySettings");
  },
};