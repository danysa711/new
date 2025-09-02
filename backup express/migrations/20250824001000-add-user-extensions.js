"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Tambah kolom email ke Users
    await queryInterface.addColumn("Users", "email", {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });

    // Tambah kolom role ke Users
    await queryInterface.addColumn("Users", "role", {
      type: Sequelize.ENUM("user", "admin"),
      defaultValue: "user",
      allowNull: false,
    });

    // Tambah kolom url_slug ke Users
    await queryInterface.addColumn("Users", "url_slug", {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });

    // Membuat tabel Subscriptions
    await queryInterface.createTable("Subscriptions", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("active", "expired", "canceled"),
        defaultValue: "active",
        allowNull: false,
      },
      payment_status: {
        type: Sequelize.ENUM("pending", "paid", "failed"),
        defaultValue: "pending",
        allowNull: false,
      },
      payment_method: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Membuat tabel SubscriptionPlans
    await queryInterface.createTable("SubscriptionPlans", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      duration_days: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Update admin user role
    await queryInterface.sequelize.query(
      `UPDATE Users SET role = 'admin' WHERE username = 'admin'`
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Users", "email");
    await queryInterface.removeColumn("Users", "role");
    await queryInterface.removeColumn("Users", "url_slug");
    await queryInterface.dropTable("Subscriptions");
    await queryInterface.dropTable("SubscriptionPlans");
  },
};