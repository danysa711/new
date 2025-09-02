"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class SoftwareVersion extends Model {
    static associate(models) {
      this.belongsTo(models.Software, { foreignKey: "software_id" });
      this.hasMany(models.License, { foreignKey: "software_version_id" });
      this.belongsTo(models.User, { foreignKey: "user_id" });
    }
  }
  SoftwareVersion.init(
    {
      software_id: DataTypes.INTEGER,
      version: DataTypes.STRING,
      os: DataTypes.STRING,
      download_link: DataTypes.TEXT,
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
      modelName: "SoftwareVersion",
    }
  );
  return SoftwareVersion;
};