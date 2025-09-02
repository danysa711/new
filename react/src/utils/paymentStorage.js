// src/utils/paymentStorage.js
// Utilitas untuk menyimpan dan mengambil data pembayaran dari localStorage

// Default payment methods
const DEFAULT_PAYMENT_METHODS = [
  {
    id: 1,
    name: 'Transfer Bank BCA',
    type: 'bank',
    accountNumber: '1234567890',
    accountName: 'PT Demo Store',
    instructions: 'Transfer ke rekening BCA a/n PT Demo Store',
    isActive: true
  },
  {
    id: 2,
    name: 'QRIS',
    type: 'qris',
    qrImageUrl: 'https://example.com/qr.png',
    instructions: 'Scan kode QR menggunakan aplikasi e-wallet atau mobile banking',
    isActive: true
  },
  {
    id: 3,
    name: 'DANA',
    type: 'ewallet',
    accountNumber: '08123456789',
    accountName: 'PT Demo Store',
    instructions: 'Transfer ke akun DANA a/n PT Demo Store',
    isActive: true
  },
  {
    id: 4,
    name: 'OVO',
    type: 'ewallet',
    accountNumber: '08123456789',
    accountName: 'PT Demo Store',
    instructions: 'Transfer ke akun OVO a/n PT Demo Store',
    isActive: true
  },
  {
    id: 5,
    name: 'GoPay',
    type: 'ewallet',
    accountNumber: '08123456789',
    accountName: 'PT Demo Store',
    instructions: 'Transfer ke akun GoPay a/n PT Demo Store',
    isActive: true
  }
];

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

// Mendapatkan semua metode pembayaran
export const getPaymentMethods = () => {
  try {
    const storedMethods = localStorage.getItem(STORAGE_KEYS.MANUAL_PAYMENT_METHODS);
    if (storedMethods) {
      return JSON.parse(storedMethods);
    }
    // Jika tidak ada data, gunakan default dan simpan
    savePaymentMethods(DEFAULT_PAYMENT_METHODS);
    return DEFAULT_PAYMENT_METHODS;
  } catch (error) {
    console.error('Error loading payment methods:', error);
    return DEFAULT_PAYMENT_METHODS;
  }
};

// Menyimpan metode pembayaran
export const savePaymentMethods = (methods) => {
  try {
    localStorage.setItem(STORAGE_KEYS.MANUAL_PAYMENT_METHODS, JSON.stringify(methods));
    // Trigger event untuk memberitahu komponen lain
    triggerPaymentUpdate('methods_updated');
    return true;
  } catch (error) {
    console.error('Error saving payment methods:', error);
    return false;
  }
};

// Mendapatkan status Tripay
export const getTripayStatus = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.TRIPAY_ENABLED) === 'true';
  } catch (error) {
    console.error('Error getting Tripay status:', error);
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
    console.error('Error saving Tripay status:', error);
    return false;
  }
};

// Mendapatkan konfigurasi Tripay
export const getTripayConfig = () => {
  try {
    return {
      api_key: localStorage.getItem(STORAGE_KEYS.TRIPAY_API_KEY) || '',
      private_key: localStorage.getItem(STORAGE_KEYS.TRIPAY_PRIVATE_KEY) || '',
      merchant_code: localStorage.getItem(STORAGE_KEYS.TRIPAY_MERCHANT_CODE) || '',
      sandbox_mode: localStorage.getItem(STORAGE_KEYS.TRIPAY_SANDBOX_MODE) === 'true'
    };
  } catch (error) {
    console.error('Error getting Tripay config:', error);
    return {
      api_key: '',
      private_key: '',
      merchant_code: '',
      sandbox_mode: true
    };
  }
};

// Menyimpan konfigurasi Tripay
export const saveTripayConfig = (config) => {
  try {
    localStorage.setItem(STORAGE_KEYS.TRIPAY_API_KEY, config.api_key || '');
    // Hanya update private key jika ada (bukan placeholder)
    if (config.private_key && config.private_key !== '********') {
      localStorage.setItem(STORAGE_KEYS.TRIPAY_PRIVATE_KEY, config.private_key);
    }
    localStorage.setItem(STORAGE_KEYS.TRIPAY_MERCHANT_CODE, config.merchant_code || '');
    localStorage.setItem(STORAGE_KEYS.TRIPAY_SANDBOX_MODE, (config.sandbox_mode || false).toString());
    
    // Trigger event untuk memberitahu komponen lain
    triggerPaymentUpdate('tripay_config_updated');
    return true;
  } catch (error) {
    console.error('Error saving Tripay config:', error);
    return false;
  }
};

// Mendapatkan semua metode pembayaran yang tersedia (Tripay + Manual)
export const getAllAvailablePaymentMethods = () => {
  const manualMethods = getPaymentMethods();
  const tripayEnabled = getTripayStatus();
  
  // Format metode manual
  const formattedManualMethods = manualMethods
    .filter(method => method.isActive)
    .map(method => ({
      code: `MANUAL_${method.id}`,
      name: method.name,
      type: method.type,
      fee: 0,
      isManual: true,
      manualData: {
        id: method.id,
        name: method.name,
        type: method.type,
        accountNumber: method.accountNumber,
        accountName: method.accountName,
        instructions: method.instructions,
        qrImageUrl: method.qrImageUrl,
        isActive: method.isActive
      }
    }));
  
  // Jika Tripay tidak aktif, hanya kembalikan metode manual
  if (!tripayEnabled) {
    return formattedManualMethods;
  }
  
  // Metode Tripay
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
  
  // Gabungkan kedua metode
  return [...tripayMethods, ...formattedManualMethods];
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
    console.error('Error triggering payment update:', error);
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
  getPaymentMethods,
  savePaymentMethods,
  getTripayStatus,
  saveTripayStatus,
  getTripayConfig,
  saveTripayConfig,
  getAllAvailablePaymentMethods,
  triggerPaymentUpdate,
  subscribeToPaymentUpdates
};