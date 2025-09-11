"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Subscription extends Model {
    static associate(models) {
      // Association ke User - perbaikan penggunaan as dan onDelete/onUpdate
      this.belongsTo(models.User, { 
        foreignKey: "user_id",
        as: "user",
        onDelete: 'SET NULL',  // Jika user dihapus, tetap pertahankan langganan tapi set user_id ke NULL
        onUpdate: 'CASCADE'    // Jika user ID berubah, update juga di subscription
      });
      
      // Association ke Transaction
      this.belongsTo(models.Transaction, {
        foreignKey: "transaction_id",
        as: "transaction",
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
    }
  }

  Subscription.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,  // Ubah menjadi allowNull:true agar bisa handle kasus user dihapus
        references: {
          model: "Users",
          key: "id",
        },
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("active", "expired", "canceled"),
        defaultValue: "active",
        allowNull: false,
      },
      payment_status: {
        type: DataTypes.ENUM("pending", "paid", "failed"),
        defaultValue: "pending",
        allowNull: false,
      },
      payment_method: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      tripay_reference: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      tripay_merchant_ref: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      transaction_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "transactions",
          key: "id",
        },
      },
    },
    {
      sequelize,
      modelName: "Subscription",
      tableName: "Subscriptions", 
      timestamps: true,
    }
  );

  return Subscription;
};