const axios = require('axios');
const API_URL = 'https://db.kinterstore.my.id/api';
const FALLBACK_URL = 'https://kinterstore.my.id/api';

const tripayService = {
  // Mendapatkan metode pembayaran
  getPaymentChannels: async () => {
    try {
      // Tambahkan timeout yang lebih lama untuk memberikan waktu API merespons
      const response = await axios.get(`${API_URL}/tripay/payment-channels`, {
        timeout: 10000 // 10 detik timeout
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching payment channels:', error);
      
      // Coba fallback URL jika URL utama gagal
      try {
        console.log('Trying fallback URL for payment channels');
        const fallbackResponse = await axios.get(`${FALLBACK_URL}/tripay/payment-channels`, {
          timeout: 10000
        });
        return fallbackResponse.data;
      } catch (fallbackError) {
        console.error('Fallback URL also failed:', fallbackError);
        
        // Kembalikan data fallback jika kedua URL gagal
        return [
          { code: 'QRIS', name: 'QRIS', type: 'qris', fee: 800, active: true },
          { code: 'BCAVA', name: 'Bank BCA', type: 'bank', fee: 4000, active: true }
        ];
      }
    }
  },

  // Membuat transaksi baru
  createTransaction: async (payload) => {
    try {
      // Perbaikan endpoint untuk create transaction
      const response = await axios.post(`${API_URL}/subscriptions/purchase`, payload);
      return response.data;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  },

  // Mendapatkan detail transaksi
  getTransactionDetail: async (reference) => {
    try {
      // Perbaikan endpoint untuk transaction detail
      const response = await axios.get(`${API_URL}/tripay/transaction-detail/${reference}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction detail:', error);
      throw error;
    }
  },
  
  // Mendapatkan status transaksi
  getTransactionStatus: async (reference) => {
    try {
      // Perbaikan endpoint untuk transaction status
      const response = await axios.get(`${API_URL}/tripay/transaction-status/${reference}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction status:', error);
      throw error;
    }
  }
};

module.exports = tripayService;