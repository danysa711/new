// models/QrisPayment.js
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class QrisPayment extends Model {
    static associate(models) {
      // Hubungkan QrisPayment dengan User
      this.belongsTo(models.User, { 
        foreignKey: "user_id",
        as: "User" // Penting untuk digunakan di include query
      });
      
      // Hubungkan QrisPayment dengan SubscriptionPlan
      this.belongsTo(models.SubscriptionPlan, { 
        foreignKey: "plan_id", 
        as: "Plan"
      });
    }
  }

  QrisPayment.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id"
        }
      },
      plan_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "SubscriptionPlans",
          key: "id"
        }
      },
      order_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('pending', 'waiting_verification', 'verified', 'rejected', 'expired'),
        defaultValue: 'pending',
        allowNull: false
      },
      expired_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      verified_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      rejected_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      plan_name: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: "QrisPayment",
      tableName: "qris_payments",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return QrisPayment;
};