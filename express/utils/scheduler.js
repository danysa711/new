// utils/scheduler.js
const cron = require('node-cron');
const { db } = require('../models'); // Perbaikan impor
const { Op } = require('sequelize');

// Jalankan scheduler setiap 5 menit
const startScheduler = () => {
  console.log('Starting scheduler...');
  
  // Cek dan update pembayaran yang kadaluarsa
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('Checking expired payments...');
      
      // Pastikan QrisPayment diambil dari db
      const { QrisPayment } = db;
      
      if (!QrisPayment) {
        console.error('QrisPayment model not found');
        return;
      }
      
      // Ambil semua pembayaran yang belum terverifikasi dan sudah kadaluarsa
      const expiredPayments = await QrisPayment.findAll({
        where: {
          status: ['pending', 'waiting_verification'],
          expired_at: {
            [Op.lt]: new Date()
          }
        }
      });
      
      console.log(`Found ${expiredPayments.length} expired payments`);
      
      // Update status menjadi expired
      for (const payment of expiredPayments) {
        await payment.update({
          status: 'expired'
        });
        
        console.log(`Payment #${payment.order_number} marked as expired`);
      }
    } catch (error) {
      console.error('Error checking expired payments:', error);
    }
  });
};

module.exports = { startScheduler };