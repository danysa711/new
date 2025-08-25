"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class SoftwareVersion extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  SoftwareVersion.init(
    {
      software_id: DataTypes.INTEGER,
      version: DataTypes.STRING,
      os: DataTypes.STRING,
      download_link: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "SoftwareVersion",
    }
  );
  return SoftwareVersion;
};
