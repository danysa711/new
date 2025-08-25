"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class License extends Model {
    static associate(models) {
      this.belongsTo(models.Software, { foreignKey: "software_id" });
      this.belongsTo(models.SoftwareVersion, { foreignKey: "software_version_id" });
      this.belongsToMany(models.Order, { through: models.OrderLicense, foreignKey: "license_id", otherKey: "order_id" });
    }
  }

  License.init(
    {
      software_id: { type: DataTypes.INTEGER, allowNull: false },
      software_version_id: { type: DataTypes.INTEGER, allowNull: true }, // Kolom baru untuk relasi ke SoftwareVersion
      license_key: { type: DataTypes.STRING, allowNull: false, unique: true },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: false },
      used_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: "License",
    }
  );

  return License;
};
