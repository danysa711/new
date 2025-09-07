// migrations/20250907000003-create-baileys-settings.js
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('baileys_settings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      phone_number: {
        type: Sequelize.STRING,
        allowNull: false
      },
      group_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      notification_enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      template_message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('baileys_settings');
  }
};