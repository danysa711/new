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
// Buat pembayaran QRIS
export const createQrisPayment = async (planId, userId) => {
  try {
    const response = await axiosInstance.post("/api/qris-payment", {
      plan_id: planId,
      user_id: userId
    });
    return response.data;
  } catch (error) {
    console.error("Error createQrisPayment:", error);
    throw error;
  }
};

// Upload bukti pembayaran
export const uploadPaymentProof = async (reference, file, userId) => {
  try {
    const formData = new FormData();
    formData.append("payment_proof", file);
    formData.append("user_id", userId);

    const response = await axiosInstance.post(
      `/api/qris-payment/${reference}/upload`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" }
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error uploadPaymentProof:", error);
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