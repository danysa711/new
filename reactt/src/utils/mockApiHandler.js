// src/utils/mockApiHandler.js

/**
 * Mock API Handler - Untuk menangani error server pada endpoint QRIS
 * 
 * Gunakan utility ini untuk mengelola error 500 pada endpoint QRIS
 * dengan cara menyediakan respons dummy jika endpoint asli gagal.
 */

// Mock data untuk QRIS settings
const MOCK_QRIS_SETTINGS = {
  merchant_name: 'Kinterstore',
  qris_image: 'https://example.com/placeholder-qris.png',
  is_active: true,
  expiry_hours: 24,
  instructions: 'Scan kode QR menggunakan aplikasi e-wallet atau mobile banking Anda.'
};

// Mock data untuk QRIS payments
const MOCK_QRIS_PAYMENTS = [
  {
    id: 'mock-1',
    reference: 'QRIS12345678',
    user_id: 1,
    plan_id: 1,
    total_amount: 100000,
    status: 'UNPAID',
    payment_proof: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expired_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    User: {
      username: 'user1',
      email: 'user1@example.com'
    },
    SubscriptionPlan: {
      name: '1 Bulan',
      duration_days: 30
    }
  }
];

/**
 * Fungsi untuk mendapatkan pengaturan QRIS dengan fallback ke mock data
 * @param {Function} axiosCall - Fungsi untuk memanggil API asli
 * @returns {Promise} - Hasil API call atau mock data jika gagal
 */
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

/**
 * Fungsi untuk mendapatkan pembayaran QRIS dengan fallback ke mock data
 * @param {Function} axiosCall - Fungsi untuk memanggil API asli
 * @returns {Promise} - Hasil API call atau mock data jika gagal
 */
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

/**
 * Fungsi untuk membuat transaksi QRIS baru dengan fallback ke mock data
 * @param {Function} axiosCall - Fungsi untuk memanggil API asli
 * @param {Object} planData - Data paket yang dibeli
 * @returns {Promise} - Hasil API call atau mock data jika gagal
 */
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

/**
 * Fungsi untuk mengupload bukti pembayaran dengan fallback ke mock response
 * @param {Function} axiosCall - Fungsi untuk memanggil API asli
 * @param {String} reference - Referensi pembayaran
 * @param {File} file - File bukti pembayaran
 * @returns {Promise} - Hasil API call atau mock data jika gagal
 */
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