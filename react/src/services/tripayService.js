const axios = require('axios');

const API_URL = 'https://db.kinterstore.my.id/api';

const tripayService = {
  // Mendapatkan metode pembayaran
  getPaymentChannels: async () => {
    try {
      const response = await axios.get(`${API_URL}/payment/channels`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment channels:', error);
      throw error;
    }
  },

  // Membuat transaksi baru
  createTransaction: async (payload) => {
    try {
      const response = await axios.post(`${API_URL}/payment/create`, payload);
      return response.data;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  },

  // Mendapatkan detail transaksi
  getTransactionDetail: async (reference) => {
    try {
      const response = await axios.get(`${API_URL}/payment/detail/${reference}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction detail:', error);
      throw error;
    }
  },
  
  // Mendapatkan status transaksi
  getTransactionStatus: async (reference) => {
    try {
      const response = await axios.get(`${API_URL}/payment/status/${reference}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction status:', error);
      throw error;
    }
  }
};

module.exports = tripayService;