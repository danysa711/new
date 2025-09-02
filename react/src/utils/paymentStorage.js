// src/utils/paymentStorage.js
// Utilitas untuk menyimpan dan mengambil data pembayaran dari localStorage

// Konstanta untuk key localStorage
const STORAGE_KEYS = {
  MANUAL_PAYMENT_METHODS: 'kinterstore_payment_methods',
  TRIPAY_ENABLED: 'kinterstore_tripay_enabled',
  TRIPAY_API_KEY: 'kinterstore_tripay_api_key',
  TRIPAY_PRIVATE_KEY: 'kinterstore_tripay_private_key',
  TRIPAY_MERCHANT_CODE: 'kinterstore_tripay_merchant_code',
  TRIPAY_SANDBOX_MODE: 'kinterstore_tripay_sandbox_mode',
  PAYMENT_EVENT: 'kinterstore_payment_update'
};

// Mendapatkan status Tripay
export const getTripayStatus = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.TRIPAY_ENABLED) === 'true';
  } catch (error) {
    console.error('Error mendapatkan status Tripay:', error);
    return false;
  }
};

// Menyimpan status Tripay
export const saveTripayStatus = (enabled) => {
  try {
    localStorage.setItem(STORAGE_KEYS.TRIPAY_ENABLED, enabled.toString());
    // Trigger event untuk memberitahu komponen lain
    triggerPaymentUpdate('tripay_status_updated');
    return true;
  } catch (error) {
    console.error('Error menyimpan status Tripay:', error);
    return false;
  }
};

// Custom event untuk payment update (agar komponen bisa subscribe)
export const triggerPaymentUpdate = (action) => {
  try {
    // Gunakan storage event sebagai mekanisme komunikasi antar tab/komponen
    localStorage.setItem(STORAGE_KEYS.PAYMENT_EVENT, JSON.stringify({
      action,
      timestamp: new Date().getTime()
    }));
    
    // Trigger custom event untuk component dalam halaman yang sama
    const event = new CustomEvent('payment_updated', { 
      detail: { action, timestamp: new Date().getTime() }
    });
    window.dispatchEvent(event);
    
    return true;
  } catch (error) {
    console.error('Error memicu pembaruan pembayaran:', error);
    return false;
  }
};

// Subscribe ke event payment update
export const subscribeToPaymentUpdates = (callback) => {
  // Event untuk komponen dalam halaman yang sama
  window.addEventListener('payment_updated', (event) => {
    callback(event.detail);
  });
  
  // Storage event untuk komponen di tab/window berbeda
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEYS.PAYMENT_EVENT) {
      try {
        const detail = JSON.parse(event.newValue);
        callback(detail);
      } catch (error) {
        console.error('Error parsing payment event:', error);
      }
    }
  });
  
  // Return function untuk unsubscribe
  return () => {
    window.removeEventListener('payment_updated', callback);
    window.removeEventListener('storage', callback);
  };
};

export default {
  getTripayStatus,
  saveTripayStatus,
  triggerPaymentUpdate,
  subscribeToPaymentUpdates
};