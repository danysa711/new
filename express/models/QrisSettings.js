const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const QrisSettings = sequelize.define(
  "QrisSettings",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    merchant_name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Kinterstore",
    },
    qris_image: {
      type: DataTypes.TEXT('long'), // Ubah menjadi TEXT('long') untuk menampung base64 yang panjang
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    expiry_hours: {
      type: DataTypes.INTEGER,
      defaultValue: 24,
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = QrisSettings;