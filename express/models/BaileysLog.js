// models/BaileysLog.js
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class BaileysLog extends Model {
    static associate(models) {
      // No associations
    }
  }

  BaileysLog.init(
    {
      type: {
        type: DataTypes.ENUM("connection", "notification", "verification", "error"),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("success", "failed", "pending"),
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      data: {
        type: DataTypes.JSON,
        allowNull: true,
      }
    },
    {
      sequelize,
      modelName: "BaileysLog",
      tableName: "baileys_logs",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return BaileysLog;
};