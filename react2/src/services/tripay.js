import axiosInstance from './axios';

// Get payment channels
export const getPaymentChannels = async () => {
  try {
    const response = await axiosInstance.get('/api/tripay/payment-channels');
    return response.data;
  } catch (error) {
    console.error('Error fetching payment channels:', error);
    throw error;
  }
};

// Calculate fee
export const calculateFee = async (amount, code) => {
  try {
    const response = await axiosInstance.post('/api/tripay/calculate-fee', { amount, code });
    return response.data;
  } catch (error) {
    console.error('Error calculating fee:', error);
    throw error;
  }
};

// Create transaction
export const createTransaction = async (data) => {
  try {
    const response = await axiosInstance.post('/api/tripay/create-transaction', data);
    return response.data;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

// Get transaction details
export const getTransactionDetail = async (reference) => {
  try {
    const response = await axiosInstance.get(`/api/tripay/transaction/${reference}`);
    return response.data;
  } catch (error) {
    console.error('Error getting transaction details:', error);
    throw error;
  }
};