// express/models/QrisPayment.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const QrisPayment = sequelize.define(
  "QrisPayment",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    plan_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "SubscriptionPlans",
        key: "id",
      },
    },
    reference: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    unique_code: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("UNPAID", "PAID", "EXPIRED", "REJECTED"),
      defaultValue: "UNPAID",
    },
    payment_proof: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    whatsapp_notification_sent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    whatsapp_verification: {
      type: DataTypes.ENUM("PENDING", "VERIFIED", "REJECTED"),
      defaultValue: "PENDING",
    },
    expired_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = QrisPayment;