"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // Jika ada relasi ke tabel lain, definisikan di sini
      // Contoh: User bisa memiliki banyak Order (jika ada tabel Order)
      // this.hasMany(models.Order, { foreignKey: "user_id" });
    }
  }

  User.init(
    {
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
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
