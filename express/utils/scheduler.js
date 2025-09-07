// utils/scheduler.js
const cron = require('node-cron');
const { QrisPayment, Subscription, User } = require('../models');

// Jalankan scheduler setiap 5 menit
const startScheduler = () => {
  console.log('Starting scheduler...');
  
  // Cek dan update pembayaran yang kadaluarsa
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('Checking expired payments...');
      
      // Ambil semua pembayaran yang belum terverifikasi dan sudah kadaluarsa
      const expiredPayments = await QrisPayment.findAll({
        where: {
          status: ['pending', 'waiting_verification'],
          expired_at: {
            [db.Sequelize.Op.lt]: new Date()
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