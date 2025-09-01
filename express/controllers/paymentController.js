const updateSubscriptionAfterPayment = async (userId, subscriptionId, durationDays) => {
  try {
    const { Subscription, db } = require('../models');
    
    // Cari langganan yang ada
    const subscription = await Subscription.findOne({
      where: {
        id: subscriptionId,
        user_id: userId
      }
    });
    
    if (!subscription) {
      console.error(`Langganan dengan ID ${subscriptionId} tidak ditemukan`);
      return null;
    }
    
    // Hitung tanggal akhir baru
    let newEndDate;
    
    // Jika langganan sudah berakhir, mulai dari hari ini
    if (new Date(subscription.end_date) < new Date()) {
      newEndDate = new Date();
      newEndDate.setDate(newEndDate.getDate() + durationDays);
    } else {
      // Jika langganan masih aktif, tambahkan ke tanggal akhir saat ini
      newEndDate = new Date(subscription.end_date);
      newEndDate.setDate(newEndDate.getDate() + durationDays);
    }
    
    // Perbarui status langganan
    const updatedSubscription = await subscription.update({
      status: 'active',
      payment_status: 'paid',
      end_date: newEndDate
    });
    
    console.log(`Langganan berhasil diperbarui: ${subscriptionId}, tanggal akhir baru: ${newEndDate}`);
    
    return updatedSubscription;
  } catch (error) {
    console.error('Gagal memperbarui langganan:', error);
    return null;
  }
};
