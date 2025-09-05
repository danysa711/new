// src/api/api-service-enhanced.js
import axios from 'axios';
import { message } from 'antd';

/**
 * API Service yang ditingkatkan dengan penanganan error yang lebih baik
 * Khusus untuk menangani error 403, 500, dan masalah refresh token
 */

// Konstanta untuk retry
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const FALLBACK_URLS = [
  'https://db.kinterstore.my.id',
  'https://backup.kinterstore.my.id',
  'https://api.kinterstore.my.id'
];

// Mendapatkan token dari localStorage atau sessionStorage
const getToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// Mendapatkan refresh token
const getRefreshToken = () => {
  return localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
};

// Mendapatkan URL backend aktif
const getActiveBackendUrl = () => {
  try {
    // Coba dapatkan dari data user
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      if (userData.backend_url) {
        return userData.backend_url;
      }
    }
  } catch (error) {
    console.error('Error parsing user data:', error);
  }
  
  // Jika tidak ada di user data, coba dari storage langsung
  return localStorage.getItem('backendUrl') || 'https://db.kinterstore.my.id';
};

// Menyimpan token baru
const saveToken = (token, refreshToken = null) => {
  const remember = localStorage.getItem('remember') === 'true';
  
  if (remember) {
    localStorage.setItem('token', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  } else {
    sessionStorage.setItem('token', token);
    if (refreshToken) sessionStorage.setItem('refreshToken', refreshToken);
  }
};

// Membersihkan token
const clearTokens = () => {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  sessionStorage.removeItem('refreshToken');
};

// Fungsi untuk refresh token
const refreshToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    console.warn('Tidak ada refresh token');
    return { success: false };
  }
  
  try {
    // Tambahkan timestamp untuk menghindari cache
    const timestamp = Date.now();
    const currentUrl = getActiveBackendUrl();
    
    // Coba beberapa URL jika gagal
    for (const baseUrl of [currentUrl, ...FALLBACK_URLS]) {
      try {
        const response = await axios.post(
          `${baseUrl}/api/user/refresh?ts=${timestamp}`,
          { token: refreshToken },
          {
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            }
          }
        );
        
        if (response.data && response.data.token) {
          saveToken(response.data.token);
          console.log('Token berhasil diperbarui');
          return { success: true, token: response.data.token };
        }
      } catch (err) {
        console.warn(`Gagal refresh token dari ${baseUrl}:`, err);
      }
    }
    
    // Jika semua url gagal
    return { success: false };
  } catch (error) {
    console.error('Error refreshing token:', error);
    return { success: false };
  }
};

// Fungsi untuk membuat request dengan retry dan fallback
export const makeRequest = async (options) => {
  const {
    method = 'GET',
    endpoint,
    data = null,
    params = null,
    showError = true,
    maxRetries = MAX_RETRIES,
    baseUrls = [getActiveBackendUrl(), ...FALLBACK_URLS],
    timeout = 15000
  } = options;
  
  let lastError = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Tunggu sebentar jika ini bukan percobaan pertama
    if (attempt > 0) {
      const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // Coba setiap URL jika gagal
    for (const baseUrl of baseUrls) {
      try {
        const token = getToken();
        
        // Tambahkan timestamp untuk menghindari cache
        const url = new URL(endpoint, baseUrl);
        url.searchParams.append('ts', Date.now().toString());
        
        const headers = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const axiosConfig = {
          method,
          url: url.toString(),
          headers,
          timeout: timeout + (attempt * 5000) // Tambahkan timeout untuk setiap retry
        };
        
        if (data && method !== 'GET') {
          axiosConfig.data = data;
        }
        
        if (params) {
          axiosConfig.params = params;
        }
        
        console.log(`Making ${method} request to ${url.toString()} (attempt ${attempt + 1}/${maxRetries})`);
        const response = await axios(axiosConfig);
        
        return {
          success: true,
          data: response.data,
          status: response.status
        };
      } catch (error) {
        console.warn(`Error on ${baseUrl}${endpoint} (attempt ${attempt + 1}):`, error);
        lastError = error;
        
        // Cek apakah ini error autentikasi
        if (error.response && error.response.status === 403) {
          // Coba refresh token
          console.log('Token error, coba refresh token');
          const refreshResult = await refreshToken();
          
          if (refreshResult.success) {
            // Jika refresh berhasil, coba request lagi dengan token baru
            console.log('Token berhasil direfresh, mencoba request ulang');
            continue;
          } else {
            // Jika refresh gagal, bersihkan token dan kembalikan error
            console.warn('Refresh token gagal, membersihkan data sesi');
            clearTokens();
            
            if (showError) {
              message.error('Sesi Anda telah berakhir. Silakan login kembali.');
            }
            
            return {
              success: false,
              error: 'auth_error',
              message: 'Sesi Anda telah berakhir. Silakan login kembali.'
            };
          }
        }
        
        // Jika server error, coba URL selanjutnya
        if (error.response && error.response.status >= 500) {
          console.warn(`Server error pada ${baseUrl}, mencoba URL lain`);
          continue;
        }
      }
    }
  }
  
  // Jika semua URL dan retries gagal
  if (lastError && lastError.response) {
    if (showError) {
      message.error('Gagal menghubungi server. Silakan coba lagi nanti.');
    }
    
    return {
      success: false,
      status: lastError.response.status,
      error: lastError.response.data?.error || 'unknown_error',
      message: lastError.response.data?.message || 'Terjadi kesalahan pada server'
    };
  } else {
    if (showError) {
      message.error('Gagal terhubung ke server. Periksa koneksi internet Anda.');
    }
    
    return {
      success: false,
      error: 'network_error',
      message: 'Gagal terhubung ke server. Periksa koneksi internet Anda.'
    };
  }
};

// Fungsi untuk memuat data QRIS dengan penanganan error khusus
export const getQrisData = async (options = {}) => {
  const { showError = true } = options;
  
  // Coba beberapa endpoint yang berbeda
  const endpoints = [
    '/api/qris-payments',
    '/api/user/qris-payments',
    '/api/payments/qris'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const result = await makeRequest({
        endpoint,
        showError: false
      });
      
      if (result.success) {
        return { success: true, data: result.data };
      }
    } catch (err) {
      console.warn(`Gagal memuat dari ${endpoint}:`, err);
    }
  }
  
  // Jika semua endpoint gagal, gunakan data fallback
  console.warn('Semua endpoint gagal, menggunakan data kosong');
  
  if (showError) {
    message.warning('Tidak dapat memuat data pembayaran. Menggunakan data lokal.');
  }
  
  return { success: false, data: [] };
};

// Fungsi untuk mendapatkan pengaturan QRIS dengan penanganan error khusus
export const getQrisSettings = async (options = {}) => {
  const { showError = true } = options;
  
  // Coba beberapa endpoint yang berbeda
  const endpoints = [
    '/api/settings/qris-public',
    '/api/qris-settings/public',
    '/api/qris-settings',
    '/api/admin/qris-settings'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const result = await makeRequest({
        endpoint,
        showError: false
      });
      
      if (result.success) {
        return { success: true, data: result.data };
      }
    } catch (err) {
      console.warn(`Gagal memuat pengaturan QRIS dari ${endpoint}:`, err);
    }
  }
  
  // Jika semua endpoint gagal, gunakan data fallback
  const fallbackSettings = {
    merchant_name: "Kinterstore",
    qris_image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAFAAQMAAAD3XjfpAAAABlBMVEX///8AAABVwtN+AAABA0lEQVRo3u2YMQ7DIAxFDRk5Qo7AUTgaR+loOQJHYKSImVTNH8fUVSvBwJs88Gfwl2MwEHweHEIoiqIoiqIoitqkL+p5tgAC+Cx4GGNc/kdc5QcRgA/CgwhAACCAAAIIIIB/CwaRAJ8QLwq+QwgggADuBS8KAQQQQDAF9ABmtbqzn6DUa3Yy8ipdV6t76aYN26xFR76yKTbecw5xg7XT0PTLna5YeVGrZqDT/mllTfG6Wdr9KE+5c5p+0xt0w7afMOvQPFQHbqiPmJqTjnGnJmK4epEQ74KDOPNeCnXngJ2KAu4XAL5fWGIbk8jm1+sA4D+CeywAAAQQQAABBBBAAKdlDkO5qQMRbkZBAAAAAElFTkSuQmCC",
    is_active: true,
    expiry_hours: 1,
    instructions: "Scan kode QR menggunakan aplikasi e-wallet atau mobile banking Anda."
  };
  
  console.warn('Semua endpoint pengaturan QRIS gagal, menggunakan data default');
  
  if (showError) {
    message.warning('Tidak dapat memuat pengaturan QRIS. Menggunakan pengaturan default.');
  }
  
  return { success: false, data: fallbackSettings };
};

// Fungsi untuk membuat pembayaran QRIS dengan penanganan error
export const createQrisPayment = async (planId, options = {}) => {
  const { showError = true } = options;
  
  try {
    const result = await makeRequest({
      method: 'POST',
      endpoint: '/api/qris-payment',
      data: { plan_id: planId },
      showError
    });
    
    if (result.success) {
      return { success: true, payment: result.data.payment };
    } else {
      throw new Error(result.message || 'Gagal membuat pembayaran QRIS');
    }
  } catch (error) {
    console.error('Error creating QRIS payment:', error);
    
    if (showError) {
      message.error('Gagal membuat pembayaran QRIS. Silakan coba lagi nanti.');
    }
    
    // Buat dummy payment untuk fallback UI
    return {
      success: false,
      payment: {
        reference: `QRIS${Date.now().toString().slice(-8)}`,
        total_amount: 100000, // Default amount
        status: 'UNPAID',
        createdAt: new Date().toISOString(),
        expired_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      }
    };
  }
};

// Fungsi untuk membatalkan pembayaran QRIS dengan penanganan error
export const cancelQrisPayment = async (reference, options = {}) => {
  const { showError = true } = options;
  
  try {
    const result = await makeRequest({
      method: 'POST',
      endpoint: `/api/qris-payment/${reference}/cancel`,
      showError
    });
    
    if (result.success) {
      if (showError) {
        message.success('Pembayaran berhasil dibatalkan');
      }
      return { success: true };
    } else {
      throw new Error(result.message || 'Gagal membatalkan pembayaran');
    }
  } catch (error) {
    console.error('Error canceling QRIS payment:', error);
    
    if (showError) {
      message.error('Gagal membatalkan pembayaran. Silakan coba lagi nanti.');
    }
    
    return { success: false, message: error.message };
  }
};

// Cek status pembayaran QRIS dengan penanganan error
export const checkQrisPaymentStatus = async (reference, options = {}) => {
  const { showError = true } = options;
  
  try {
    const result = await makeRequest({
      endpoint: `/api/qris-payment/${reference}/check`,
      showError
    });
    
    if (result.success) {
      return { success: true, ...result.data };
    } else {
      throw new Error(result.message || 'Gagal memeriksa status pembayaran');
    }
  } catch (error) {
    console.error('Error checking QRIS payment status:', error);
    
    if (showError) {
      message.error('Gagal memeriksa status pembayaran. Silakan coba lagi nanti.');
    }
    
    return { success: false, message: error.message };
  }
};

export default {
  makeRequest,
  getQrisData,
  getQrisSettings,
  createQrisPayment,
  cancelQrisPayment,
  checkQrisPaymentStatus
};