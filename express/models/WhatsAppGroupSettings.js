// express/models/WhatsAppGroupSettings.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const WhatsAppGroupSettings = sequelize.define(
  "WhatsAppGroupSettings",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    group_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    group_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    notification_template: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "Cek status pembayaran username: {username} untuk paket {plan_name} dengan nominal Rp {amount}",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = WhatsAppGroupSettings;