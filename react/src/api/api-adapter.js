// File: api/api-adapter.js

import { detectDomainAndGenerateBackendUrl } from '../utils/domainUtils';

/**
 * API Adapter - Modul untuk menghubungkan frontend dengan berbagai backend
 * 
 * Adapter ini memungkinkan aplikasi untuk:
 * 1. Bekerja dengan backend utama (berdasarkan domain saat ini)
 * 2. Bekerja dengan backend spesifik per user
 * 3. Menangani autentikasi secara konsisten di semua backend
 */

// Fungsi untuk mendapatkan URL backend yang aktif
export const getActiveBackendUrl = () => {
  // Prioritas: URL backend dari user aktif > URL backend yang tersimpan > URL berdasarkan domain saat ini
  try {
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
  
  // Jika tidak ada di user data, gunakan yang tersimpan di localStorage
  const savedBackendUrl = localStorage.getItem('backendUrl');
  if (savedBackendUrl) {
    return savedBackendUrl;
  }
  
  // Jika tidak ada yang tersimpan, gunakan backend URL berdasarkan domain saat ini
  return detectDomainAndGenerateBackendUrl();
};

// Fungsi untuk mendapatkan token autentikasi
export const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// Fungsi untuk mendapatkan token refresh
export const getRefreshToken = () => {
  return localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
};

// Fungsi untuk membuat headers dengan autentikasi
export const createAuthHeaders = () => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Fungsi untuk fetch dengan timeout dan otentikasi
export const fetchWithAuth = async (endpoint, options = {}) => {
  const backendUrl = getActiveBackendUrl();
  const url = `${backendUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  
  // Gabungkan headers default dengan headers kustom
  const headers = {
    ...createAuthHeaders(),
    ...options.headers
  };
  
  // Set timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });
    
    // Cek apakah langganan kedaluwarsa
    if (response.status === 403) {
      const data = await response.json();
      if (data.subscriptionRequired) {
        console.warn('Subscription expired');
        // Tampilkan pesan atau arahkan ke halaman langganan
        return { error: 'subscription_expired', message: data.message };
      }
    }
    
    // Cek apakah token tidak valid
    if (response.status === 401) {
      // Coba refresh token
      const refreshed = await refreshAuthToken();
      if (refreshed) {
        // Coba lagi dengan token baru
        return fetchWithAuth(endpoint, options);
      } else {
        // Logout jika refresh gagal
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return { error: 'auth_failed', message: 'Sesi Anda telah berakhir' };
      }
    }
    
    // Parse response
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = { success: response.ok };
    }
    
    if (!response.ok) {
      return { error: data.error || 'unknown_error', message: data.message || 'Terjadi kesalahan', status: response.status };
    }
    
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      return { error: 'timeout', message: 'Permintaan melebihi batas waktu' };
    }
    
    return { error: 'network_error', message: 'Gagal terhubung ke server' };
  } finally {
    clearTimeout(timeoutId);
  }
};

// Fungsi untuk refresh token
export const refreshAuthToken = async () => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    return false;
  }
  
  try {
    const backendUrl = getActiveBackendUrl();
    const response = await fetch(`${backendUrl}/api/user/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token: refreshToken })
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    
    if (data.token) {
      // Simpan token baru
      if (localStorage.getItem('remember') === 'true') {
        localStorage.setItem('token', data.token);
      } else {
        sessionStorage.setItem('token', data.token);
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
};

// Fungsi untuk mencari pesanan dari backend spesifik user
export const findOrders = async (orderData) => {
  const backendUrl = getActiveBackendUrl();
  console.log(`Mencari pesanan di: ${backendUrl}/api/orders/find`);
  
  return fetchWithAuth('/api/orders/find', {
    method: 'POST',
    body: JSON.stringify(orderData)
  });
};

// Memperbarui URL backend untuk user
export const updateBackendUrl = async (newUrl) => {
  // Validasi format URL
  if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
    return { 
      success: false, 
      error: 'invalid_url', 
      message: 'URL harus dimulai dengan http:// atau https://' 
    };
  }
  
  try {
    // Simpan URL baru di localStorage
    localStorage.setItem('backendUrl', newUrl);
    
    // Jika user sudah login, perbarui juga di profil user
    const token = getAuthToken();
    if (token) {
      const response = await fetchWithAuth('/api/user/backend-url', {
        method: 'PUT',
        body: JSON.stringify({ backend_url: newUrl })
      });
      
      if (response.error) {
        return { 
          success: false, 
          error: response.error, 
          message: response.message 
        };
      }
      
      // Perbarui data user di storage
      try {
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          userData.backend_url = newUrl;
          
          if (localStorage.getItem('remember') === 'true') {
            localStorage.setItem('user', JSON.stringify(userData));
          } else {
            sessionStorage.setItem('user', JSON.stringify(userData));
          }
        }
      } catch (e) {
        console.error('Error updating user data:', e);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating backend URL:', error);
    return { 
      success: false, 
      error: 'update_failed', 
      message: 'Gagal memperbarui URL backend' 
    };
  }
};

// Fungsi untuk menguji koneksi ke backend
export const testBackendConnection = async (url) => {
  const testUrl = url || getActiveBackendUrl();
  
  try {
    const response = await fetch(`${testUrl}/api/test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    if (!response.ok) {
      return { 
        success: false, 
        error: 'connection_failed', 
        message: `Koneksi gagal dengan status: ${response.status}` 
      };
    }
    
    const data = await response.json();
    
    if (data && data.message === "API is working") {
      return { success: true, message: "Koneksi berhasil" };
    }
    
    return { 
      success: false, 
      error: 'invalid_response', 
      message: "Respons tidak valid dari backend" 
    };
  } catch (error) {
    console.error("Error testing connection:", error);
    return {
      success: false,
      error: 'connection_error',
      message: `Koneksi gagal: ${error.message}`
    };
  }
};