// src/utils/mockApiHandler.js

// Mock data untuk QRIS settings
const MOCK_QRIS_SETTINGS = {
  merchant_name: 'Kinterstore',
  qris_image: 'https://example.com/placeholder-qris.png',
  is_active: true,
  expiry_hours: 24,
  instructions: 'Scan kode QR menggunakan aplikasi e-wallet atau mobile banking Anda.'
};

// Mock data untuk QRIS payments
const MOCK_QRIS_PAYMENTS = [];

// Fungsi untuk mendapatkan pengaturan QRIS dengan fallback ke mock data
export const getQrisSettingsWithFallback = async (axiosCall) => {
  try {
    // Coba panggil API asli
    const response = await axiosCall();
    return response.data;
  } catch (error) {
    console.warn('API Error, using mock QRIS settings:', error);
    return MOCK_QRIS_SETTINGS;
  }
};

// Fungsi untuk mendapatkan pembayaran QRIS dengan fallback ke mock data
export const getQrisPaymentsWithFallback = async (axiosCall) => {
  try {
    // Coba panggil API asli
    const response = await axiosCall();
    return response.data;
  } catch (error) {
    console.warn('API Error, using mock QRIS payments:', error);
    return MOCK_QRIS_PAYMENTS;
  }
};

// Fungsi untuk membuat transaksi QRIS baru dengan fallback ke mock data
export const createQrisPaymentWithFallback = async (axiosCall, planData) => {
  try {
    // Coba panggil API asli
    const response = await axiosCall();
    return response.data;
  } catch (error) {
    console.warn('API Error, using mock QRIS payment creation:', error);
    
    // Buat data dummy
    const mockPayment = {
      reference: `QRIS${Date.now().toString().slice(-8)}`,
      total_amount: planData.price,
      status: 'UNPAID',
      payment_proof: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expired_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    return { success: true, payment: mockPayment };
  }
};

// Fungsi untuk mengupload bukti pembayaran dengan fallback ke mock response
export const uploadPaymentProofWithFallback = async (axiosCall, reference, file) => {
  try {
    // Coba panggil API asli
    const response = await axiosCall();
    return response.data;
  } catch (error) {
    console.warn('API Error, using mock payment proof upload:', error);
    
    // Buat mock response
    const mockPayment = {
      reference: reference,
      status: 'UNPAID',
      payment_proof: URL.createObjectURL(file),
      updatedAt: new Date().toISOString()
    };
    
    return { success: true, payment: mockPayment };
  }
};

export default {
  getQrisSettingsWithFallback,
  getQrisPaymentsWithFallback,
  createQrisPaymentWithFallback,
  uploadPaymentProofWithFallback
};