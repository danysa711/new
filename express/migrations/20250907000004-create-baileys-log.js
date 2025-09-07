// migrations/20250907000004-create-baileys-log.js
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('baileys_logs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      type: {
        type: Sequelize.ENUM('connection', 'notification', 'verification', 'error'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('success', 'failed', 'pending'),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      data: {
        type: Sequelize.JSON,
        allowNull: true
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
    await queryInterface.dropTable('baileys_logs');
  }
};