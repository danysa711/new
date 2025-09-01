router.post('/tripay/callback', async (req, res) => {
  try {
    // Ambil data dari webhook Tripay
    const { 
      merchant_ref, 
      reference, 
      status, 
      paid_at 
    } = req.body;
    
    console.log('Callback Tripay diterima:', req.body);
    
    // Validasi signature dari Tripay (menggunakan private key)
    // Implementasi validasi signature di sini...
    
    // Ambil ID langganan dari merchant_ref (format: SUB-USER_ID-SUBSCRIPTION_ID-TIMESTAMP)
    const parts = merchant_ref.split('-');
    if (parts.length < 3 || parts[0] !== 'SUB') {
      return res.status(400).json({ success: false, message: 'Format merchant_ref tidak valid' });
    }
    
    const userId = parts[1];
    const subscriptionId = parts[2];
    
    // Cari transaksi terkait
    const { Transaction, SubscriptionPlan } = require('../models');
    
    const transaction = await Transaction.findOne({
      where: { reference },
      include: [{ model: SubscriptionPlan }]
    });
    
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
    }
    
    // Perbarui status transaksi
    await transaction.update({
      status,
      paid_at: paid_at ? new Date(paid_at) : null
    });
    
    // Jika status pembayaran adalah PAID, perbarui langganan
    if (status === 'PAID') {
      // Ambil durasi dari paket langganan
      const durationDays = transaction.SubscriptionPlan.duration_days;
      
      // Perbarui langganan
      const updatedSubscription = await updateSubscriptionAfterPayment(
        userId, 
        subscriptionId, 
        durationDays
      );
      
      if (!updatedSubscription) {
        return res.status(500).json({ 
          success: false, 
          message: 'Gagal memperbarui langganan' 
        });
      }
    }
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error pada callback Tripay:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan saat memproses callback' 
    });
  }
});