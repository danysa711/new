"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class SubscriptionPlan extends Model {
    static associate(models) {
      // Association ke Transaction
      this.hasMany(models.Transaction, {
        foreignKey: 'plan_id',
        as: 'transactions'
      });
    }
  }

  SubscriptionPlan.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      duration_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      price: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "SubscriptionPlan",
      tableName: "SubscriptionPlans", // PENTING: Sesuai database schema
      timestamps: true,
    }
  );

  return SubscriptionPlan;
};