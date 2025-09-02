// src/api/qrisApi.js

import axiosInstance from '../services/axios';
import mockApiHandler from '../utils/mockApiHandler';

/**
 * QRIS API - Service untuk operasi QRIS dengan penanganan error
 * 
 * Service ini menyediakan fungsi untuk operasi QRIS dengan fallback ke mock data
 * jika API server mengalami masalah.
 */

// Mendapatkan pengaturan QRIS dengan error handling
export const getQrisSettings = async () => {
  try {
    return await mockApiHandler.getQrisSettingsWithFallback(
      async () => await axiosInstance.get('/api/qris-settings')
    );
  } catch (error) {
    console.error('Error in getQrisSettings:', error);
    throw error;
  }
};

// Mendapatkan daftar pembayaran QRIS dengan error handling
export const getQrisPayments = async () => {
  try {
    return await mockApiHandler.getQrisPaymentsWithFallback(
      async () => await axiosInstance.get('/api/qris-payments')
    );
  } catch (error) {
    console.error('Error in getQrisPayments:', error);
    throw error;
  }
};

// Membuat pembayaran QRIS baru dengan error handling
export const createQrisPayment = async (planId) => {
  try {
    const planData = { id: planId };
    return await mockApiHandler.createQrisPaymentWithFallback(
      async () => await axiosInstance.post('/api/qris-payment', { plan_id: planId }),
      planData
    );
  } catch (error) {
    console.error('Error in createQrisPayment:', error);
    throw error;
  }
};

// Mengupload bukti pembayaran dengan error handling
export const uploadPaymentProof = async (reference, file) => {
  try {
    const formData = new FormData();
    formData.append('payment_proof', file);
    
    return await mockApiHandler.uploadPaymentProofWithFallback(
      async () => await axiosInstance.post(
        `/api/qris-payment/${reference}/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      ),
      reference,
      file
    );
  } catch (error) {
    console.error('Error in uploadPaymentProof:', error);
    throw error;
  }
};

// Memeriksa status pembayaran dengan error handling
export const checkPaymentStatus = async (reference) => {
  try {
    const response = await axiosInstance.get(`/api/qris-payment/${reference}/check`);
    return response.data;
  } catch (error) {
    console.error('Error checking payment status:', error);
    // Buat respons dummy jika API gagal
    return {
      success: true,
      message: 'Status simulasi: belum berubah',
      newStatus: 'UNPAID'
    };
  }
};

export default {
  getQrisSettings,
  getQrisPayments,
  createQrisPayment,
  uploadPaymentProof,
  checkPaymentStatus
};