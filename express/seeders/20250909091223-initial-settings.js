'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('settings', [
      {
        key: 'tripay_enabled',
        value: 'true',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'tripay_api_key',
        value: process.env.TRIPAY_API_KEY || '5CVDH22vZjFAWySB7lIpCDRd2hXIBnycUA1tvHBa',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'tripay_private_key',
        value: process.env.TRIPAY_PRIVATE_KEY || '4PAWA-uFTIU-H6Ced-yK6Bz-f0AGl',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'tripay_merchant_code',
        value: process.env.TRIPAY_MERCHANT_CODE || 'T44798',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('settings', null, {});
  }
};