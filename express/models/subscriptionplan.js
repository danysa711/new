"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class SubscriptionPlan extends Model {
    static associate(models) {
      // define association here
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
        type: DataTypes.DECIMAL(10, 2),
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
      timestamps: true,
    }
  );

  return SubscriptionPlan;
};