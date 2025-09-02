// File: express/migrations/20250830000000-create-whatsapp-trial-settings.js

"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("whatsapp_trial_settings", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      whatsappNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '6281284712684'
      },
      messageTemplate: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}'
      },
      isEnabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Insert default settings
    await queryInterface.bulkInsert("whatsapp_trial_settings", [{
      whatsappNumber: '6281284712684',
      messageTemplate: 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}',
      isEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("whatsapp_trial_settings");
  },
};