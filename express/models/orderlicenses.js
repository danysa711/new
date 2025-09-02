"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class OrderLicense extends Model {
    /**
     * Helper method untuk mendefinisikan asosiasi.
     * Method ini akan dipanggil secara otomatis oleh models/index.js.
     */
    static associate(models) {
      this.belongsTo(models.Order, { foreignKey: "order_id", onDelete: "CASCADE", onUpdate: "CASCADE" });
      this.belongsTo(models.License, { foreignKey: "license_id", onDelete: "CASCADE", onUpdate: "CASCADE" });
    }
  }

  OrderLicense.init(
    {
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Orders",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      license_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Licenses",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
    },
    {
      sequelize,
      modelName: "OrderLicense",
      tableName: "order_licenses",
      timestamps: true,
    }
  );

  return OrderLicense;
};
