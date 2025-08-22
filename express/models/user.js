// express/models/user.js
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      this.hasMany(models.Software, { foreignKey: "user_id" });
      this.hasMany(models.SoftwareVersion, { foreignKey: "user_id" });
      this.hasMany(models.License, { foreignKey: "user_id" });
      this.hasMany(models.Subscription, { foreignKey: "user_id" });
    }
  }

  User.init(
    {
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM("user", "admin"),
        defaultValue: "user",
        allowNull: false,
      },
      url_slug: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      user_url_id: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      url_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "User",
      timestamps: true, // Secara default akan menambahkan `createdAt` dan `updatedAt`
    }
  );

  return User;
};