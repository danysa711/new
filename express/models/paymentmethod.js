// express/models/paymentmethod.js
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class PaymentMethod extends Model {
    static associate(models) {
      // define association here
    }
  }

  PaymentMethod.init(
    {
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      type: {
        type: DataTypes.ENUM("manual", "tripay"),
        defaultValue: "manual",
      },
      account_number: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      account_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      tripay_code: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "PaymentMethod",
    }
  );

  return PaymentMethod;
};