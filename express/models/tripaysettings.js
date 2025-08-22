// express/models/tripaysettings.js
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class TripaySettings extends Model {
    static associate(models) {
      // define association here
    }
  }

  TripaySettings.init(
    {
      api_key: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      private_key: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      merchant_code: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      is_sandbox: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "TripaySettings",
    }
  );

  return TripaySettings;
};