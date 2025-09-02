"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Software extends Model {
    static associate(models) {
      console.log("Defining Software associations");
      this.hasMany(models.SoftwareVersion, { foreignKey: "software_id" });
      this.hasMany(models.License, { foreignKey: "software_id" });
      this.hasMany(models.Order, { foreignKey: "software_id" });
      this.belongsTo(models.User, { foreignKey: "user_id" });
    }
  }
  Software.init(
    {
      name: DataTypes.STRING,
      requires_license: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      search_by_version: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Users",
          key: "id"
        }
      }
    },
    {
      sequelize,
      modelName: "Software",
    }
  );
  return Software;
};