// migrations/20250907000001-create-qris-payment.js
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('qris_payments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      plan_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'SubscriptionPlans',
          key: 'id'
        }
      },
      order_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'waiting_verification', 'verified', 'rejected', 'expired'),
        defaultValue: 'pending',
        allowNull: false
      },
      expired_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      verified_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      rejected_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      plan_name: {
        type: Sequelize.STRING,
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
    await queryInterface.dropTable('qris_payments');
  }
};