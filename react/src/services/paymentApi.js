// src/services/paymentApi.js
import axiosInstance from './axios';

// Fungsi untuk mendapatkan status Tripay
export const getTripayStatus = async () => {
  try {
    // Coba dari API
    const response = await axiosInstance.get('/api/settings/tripay-status');
    return response.data.enabled;
  } catch (error) {
    console.error('Error getting Tripay status from API:', error);
    // Fallback ke localStorage
    return localStorage.getItem('tripay_enabled') === 'true';
  }
};

// Fungsi untuk mendapatkan semua metode pembayaran
export const getAllPaymentMethods = async () => {
  try {
    // Coba dari API
    const response = await axiosInstance.get('/api/payment-methods');
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error('Invalid API response format');
  } catch (error) {
    console.error('Error getting payment methods from API:', error);
    
    // Fallback ke localStorage
    const tripayEnabled = await getTripayStatus();
    console.log('Tripay enabled (from service):', tripayEnabled);
    
    let allMethods = [];
    
    // Metode Tripay
    if (tripayEnabled) {
      const tripayMethods = [
        { code: 'QRIS', name: 'QRIS', type: 'qris', fee: 800 },
        { code: 'BRIVA', name: 'Bank BRI', type: 'bank', fee: 4000 },
        { code: 'MANDIRIVA', name: 'Bank Mandiri', type: 'bank', fee: 4000 },
        { code: 'BNIVA', name: 'Bank BNI', type: 'bank', fee: 4000 },
        { code: 'BCAVA', name: 'Bank BCA', type: 'bank', fee: 4000 },
        { code: 'OVO', name: 'OVO', type: 'ewallet', fee: 2000 },
        { code: 'DANA', name: 'DANA', type: 'ewallet', fee: 2000 },
        { code: 'LINKAJA', name: 'LinkAja', type: 'ewallet', fee: 2000 },
        { code: 'SHOPEEPAY', name: 'ShopeePay', type: 'ewallet', fee: 2000 }
      ];
      allMethods = [...tripayMethods];
    }
    
    // Metode manual
    try {
      const manualMethodsStr = localStorage.getItem('manual_payment_methods');
      if (manualMethodsStr) {
        const manualMethods = JSON.parse(manualMethodsStr)
          .filter(method => method.isActive)
          .map(method => ({
            code: `MANUAL_${method.id}`,
            name: method.name,
            type: method.type,
            fee: 0,
            isManual: true,
            manualData: method
          }));
        allMethods = [...allMethods, ...manualMethods];
      }
    } catch (e) {
      console.error('Error parsing manual methods:', e);
    }
    
    return allMethods;
  }
};