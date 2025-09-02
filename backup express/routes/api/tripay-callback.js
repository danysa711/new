// routes/api/tripay-callback.js
router.post('/callback', async (req, res) => {
  try {
    const { merchant_ref, reference, status } = req.body;
    
    // Verifikasi signature dari Tripay
    // ... kode verifikasi
    
    // Update status transaksi di database
    const transaction = await Transaction.findOne({ reference });
    if (transaction) {
      transaction.status = status;
      if (status === 'PAID') {
        transaction.paid_at = new Date();
        
        // Aktifkan langganan pengguna jika pembayaran sukses
        await activateSubscription(transaction.user_id, transaction.plan_id);
      }
      await transaction.save();
      
      // Kirim notifikasi ke pengguna (email, push notification, dll)
      // ...
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error processing Tripay callback:', err);
    res.status(500).send('Server Error');
  }
});

// Fungsi untuk mengaktifkan langganan
async function activateSubscription(userId, planId) {
  try {
    const plan = await SubscriptionPlan.findById(planId);
    const user = await User.findById(userId);
    
    if (!plan || !user) return;
    
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(now.getDate() + plan.duration_days);
    
    const subscription = new Subscription({
      user_id: userId,
      plan_id: planId,
      status: 'active',
      payment_status: 'paid',
      start_date: now,
      end_date: endDate
    });
    
    await subscription.save();
    
    // Update user status
    user.hasActiveSubscription = true;
    await user.save();
  } catch (err) {
    console.error('Error activating subscription:', err);
  }
}