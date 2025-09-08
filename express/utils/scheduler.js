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
      const { QrisPayment, SubscriptionPlan, User, Subscription, BaileysSettings, BaileysLog } = db;
      
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
        
        // Notifikasi WhatsApp jika terintegrasi
        if (global.waConnection && global.waConnection.isConnected) {
          try {
            // Ambil pengaturan WhatsApp
            const baileysSetting = await BaileysSettings.findOne({
              order: [['id', 'DESC']]
            });
            
            if (baileysSetting && baileysSetting.notification_enabled) {
              // Ambil data user
              const user = await User.findByPk(payment.user_id);
              
              if (user) {
                // Kirim notifikasi ke grup WhatsApp
                await global.waConnection.sendGroupMessage(
                  baileysSetting.group_name,
                  `⏰ Pembayaran #${payment.order_number} dari ${user.username} (${user.email}) sebesar Rp ${payment.amount.toLocaleString('id-ID')} telah kedaluwarsa.`
                );
                
                // Log notifikasi
                await BaileysLog.create({
                  type: 'notification',
                  status: 'success',
                  message: `Notifikasi pembayaran kedaluwarsa #${payment.order_number} berhasil dikirim`,
                  data: {
                    payment_id: payment.id,
                    order_number: payment.order_number,
                    user_id: payment.user_id,
                    username: user.username,
                    email: user.email
                  }
                });
              }
            }
          } catch (notifyError) {
            console.error('Error sending WhatsApp notification for expired payment:', notifyError);
          }
        }
      }
    } catch (error) {
      console.error('Error checking expired payments:', error);
    }
  });
};

module.exports = { startScheduler };