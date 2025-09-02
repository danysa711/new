// react/src/api/qris-service.js
import axiosInstance from './axios';

// Mendapatkan pengaturan QRIS
export const getQrisSettings = async () => {
  try {
    const response = await axiosInstance.get('/api/qris-settings');
    return response.data;
  } catch (error) {
    console.error('Error fetching QRIS settings:', error);
    throw error;
  }
};

// Membuat pembayaran QRIS baru
export const createQrisPayment = async (planId) => {
  try {
    const response = await axiosInstance.post('/api/qris-payment', { plan_id: planId });
    return response.data;
  } catch (error) {
    console.error('Error creating QRIS payment:', error);
    throw error;
  }
};

// Upload bukti pembayaran
export const uploadPaymentProof = async (reference, file) => {
  try {
    const formData = new FormData();
    formData.append('payment_proof', file);
    
    const response = await axiosInstance.post(
      `/api/qris-payment/${reference}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error uploading payment proof:', error);
    throw error;
  }
};

// Mendapatkan pembayaran QRIS pengguna
export const getUserQrisPayments = async () => {
  try {
    const response = await axiosInstance.get('/api/qris-payments');
    return response.data;
  } catch (error) {
    console.error('Error fetching QRIS payments:', error);
    throw error;
  }
};

export default {
  getQrisSettings,
  createQrisPayment,
  uploadPaymentProof,
  getUserQrisPayments
};