// models/QrisSettings.js
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class QrisSettings extends Model {
    static associate(models) {
      // No associations
    }
  }

  QrisSettings.init(
    {
      expiry_hours: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      qris_image: {
        type: DataTypes.STRING,
        allowNull: true,
      }
    },
    {
      sequelize,
      modelName: "QrisSettings",
      tableName: "qris_settings",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return QrisSettings;
};