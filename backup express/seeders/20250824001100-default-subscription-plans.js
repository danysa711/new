"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("SubscriptionPlans", [
      {
        name: "1 Bulan",
        duration_days: 30,
        price: 100000,
        description: "Langganan selama 1 bulan",
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "3 Bulan",
        duration_days: 90,
        price: 270000,
        description: "Langganan selama 3 bulan",
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "6 Bulan",
        duration_days: 180,
        price: 500000,
        description: "Langganan selama 6 bulan",
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "1 Tahun",
        duration_days: 365,
        price: 900000,
        description: "Langganan selama 1 tahun",
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("SubscriptionPlans", null, {});
  },
};