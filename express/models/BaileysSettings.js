// models/BaileysSettings.js
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class BaileysSettings extends Model {
    static associate(models) {
      // No associations
    }
  }

  BaileysSettings.init(
    {
      phone_number: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      group_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      notification_enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      template_message: {
        type: DataTypes.TEXT,
        allowNull: false,
      }
    },
    {
      sequelize,
      modelName: "BaileysSettings",
      tableName: "baileys_settings",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return BaileysSettings;
};