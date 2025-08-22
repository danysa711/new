// express/models/payment.js
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: "user_id" });
      this.belongsTo(models.UserSubscription, { foreignKey: "user_subscription_id" });
    }
  }

  Payment.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "Users",
          key: "id",
        },
        allowNull: false,
      },
      user_subscription_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "UserSubscriptions",
          key: "id",
        },
        allowNull: false,
      },
      payment_method: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("pending", "success", "failed"),
        defaultValue: "pending",
      },
      reference_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      payment_details: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Payment",
    }
  );

  return Payment;
};