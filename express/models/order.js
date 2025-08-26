"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file akan memanggil method ini secara otomatis.
     */
    static associate(models) {
      this.belongsTo(models.Software, { foreignKey: "software_id" });
      this.hasMany(models.OrderLicense, { foreignKey: "order_id" });
      this.belongsToMany(models.License, { through: models.OrderLicense, foreignKey: "order_id", otherKey: "license_id" });
    }
  }

  Order.init(
    {
      order_id: DataTypes.STRING,
      item_name: DataTypes.STRING,
      os: DataTypes.STRING,
      version: DataTypes.STRING,
      license_count: DataTypes.INTEGER,
      status: {
        type: DataTypes.ENUM("pending", "processed"),
        defaultValue: "pending",
      },
      software_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Software",
          key: "id",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
    },
    {
      sequelize,
      modelName: "Order",
    }
  );

  return Order;
};
