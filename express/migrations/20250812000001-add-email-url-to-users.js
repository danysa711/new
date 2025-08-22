// Nama file: express/migrations/20250812000001-add-email-url-to-users.js
"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Users", "email", {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });
    await queryInterface.addColumn("Users", "url_slug", {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });
    await queryInterface.addColumn("Users", "user_url_id", {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });
    await queryInterface.addColumn("Users", "url_active", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Users", "email");
    await queryInterface.removeColumn("Users", "url_slug");
    await queryInterface.removeColumn("Users", "user_url_id");
    await queryInterface.removeColumn("Users", "url_active");
  },
};