// src/utils/paymentStorage.js
// File utility untuk mengelola data pembayaran

import axiosInstance from "../services/axios";

// Menyimpan data pembayaran ke localStorage
export const savePaymentData = (paymentData) => {
  try {
    localStorage.setItem('currentPayment', JSON.stringify(paymentData));
    return true;
  } catch (error) {
    console.error("Error saving payment data to localStorage:", error);
    return false;
  }
};

// Mendapatkan data pembayaran dari localStorage
export const getPaymentData = () => {
  try {
    const paymentData = localStorage.getItem('currentPayment');
    return paymentData ? JSON.parse(paymentData) : null;
  } catch (error) {
    console.error("Error getting payment data from localStorage:", error);
    return null;
  }
};

// Membersihkan data pembayaran dari localStorage
export const clearPaymentData = () => {
  try {
    localStorage.removeItem('currentPayment');
    return true;
  } catch (error) {
    console.error("Error clearing payment data from localStorage:", error);
    return false;
  }
};

// Memeriksa status pembayaran Tripay
export const getTripayStatus = async (referenceId) => {
  try {
    const response = await axiosInstance.get(`/api/tripay/status/${referenceId}`);
    return response.data;
  } catch (error) {
    console.error("Error checking Tripay payment status:", error);
    return { 
      success: false, 
      error: error.response?.data?.message || "Failed to check payment status" 
    };
  }
};

// Memeriksa status pembayaran QRIS
export const getQrisStatus = async (reference) => {
  try {
    // Tambahkan timestamp untuk menghindari cache
    const timestamp = Date.now();
    const response = await axiosInstance.get(`/api/qris-payment/${reference}?ts=${timestamp}`);
    return response.data;
  } catch (error) {
    console.error("Error checking QRIS payment status:", error);
    return { 
      success: false, 
      error: error.response?.data?.message || "Failed to check QRIS payment status" 
    };
  }
};

// Menyimpan callback URL untuk redirect setelah pembayaran
export const savePaymentRedirect = (redirectUrl) => {
  try {
    localStorage.setItem('paymentRedirect', redirectUrl);
    return true;
  } catch (error) {
    console.error("Error saving payment redirect:", error);
    return false;
  }
};

// Mendapatkan callback URL untuk redirect setelah pembayaran
export const getPaymentRedirect = () => {
  try {
    return localStorage.getItem('paymentRedirect');
  } catch (error) {
    console.error("Error getting payment redirect:", error);
    return '/dashboard';
  }
};

// Membersihkan callback URL untuk redirect setelah pembayaran
export const clearPaymentRedirect = () => {
  try {
    localStorage.removeItem('paymentRedirect');
    return true;
  } catch (error) {
    console.error("Error clearing payment redirect:", error);
    return false;
  }
};

// Mendaftarkan callback untuk update status pembayaran
const paymentUpdateCallbacks = [];

// Mendaftarkan callback untuk update status pembayaran
export const subscribeToPaymentUpdates = (callback) => {
  if (typeof callback === 'function') {
    paymentUpdateCallbacks.push(callback);
    return true;
  }
  return false;
};

// Batalkan pendaftaran callback
export const unsubscribeFromPaymentUpdates = (callback) => {
  const index = paymentUpdateCallbacks.indexOf(callback);
  if (index !== -1) {
    paymentUpdateCallbacks.splice(index, 1);
    return true;
  }
  return false;
};

// Memicu notifikasi update status pembayaran ke semua callback
export const notifyPaymentUpdate = (paymentData) => {
  paymentUpdateCallbacks.forEach(callback => {
    try {
      callback(paymentData);
    } catch (error) {
      console.error("Error in payment update callback:", error);
    }
  });
};