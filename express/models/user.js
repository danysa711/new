// File: express/models/user.js

"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
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
        validate: {
          isEmail: true,
        },
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
      backend_url: {  // Tambahkan kolom baru ini
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: process.env.BACKEND_URL || "https://db.kinterstore.my.id"
      }
    },
    {
      sequelize,
      modelName: "User",
      timestamps: true,
    }
  );

  return User;
};