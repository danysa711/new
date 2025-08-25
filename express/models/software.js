"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Software extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
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
    },
    {
      sequelize,
      modelName: "Software",
    }
  );
  return Software;
};
