// express/models/usersubscription.js
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class UserSubscription extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: "user_id" });
      this.belongsTo(models.Subscription, { foreignKey: "subscription_id" });
      this.hasMany(models.Payment, { foreignKey: "user_subscription_id" });
    }
  }

  UserSubscription.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "Users",
          key: "id",
        },
        allowNull: false,
      },
      subscription_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "Subscriptions",
          key: "id",
        },
        allowNull: false,
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      is_trial: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "UserSubscription",
    }
  );

  return UserSubscription;
};