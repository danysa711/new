// File: src/services/api-config.js

/**
 * Konfigurasi API dan Backend per User
 * 
 * Dalam sistem ini:
 * 1. Backend utama menangani autentikasi dan data user
 * 2. Backend spesifik user menangani data orders, licenses, dll
 * 3. Token autentikasi dari backend utama valid untuk semua backend
 */

// URL backend utama
export const MAIN_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://db.kinterstore.my.id';

// Endpoints yang selalu menggunakan backend utama (authentication server)
export const MAIN_BACKEND_ENDPOINTS = [
  '/api/login',
  '/api/register',
  '/api/user/refresh',
  '/api/user/profile',
  '/api/user/password',
  '/api/user/backend-url',
  '/api/subscription-plans',
  '/api/subscriptions',
  '/api/tripay'
];

// Endpoints yang menggunakan backend spesifik user
export const USER_BACKEND_ENDPOINTS = [
  '/api/orders/find',
  '/api/software',
  '/api/software-versions',
  '/api/licenses'
];

/**
 * Fungsi untuk menentukan URL backend yang akan digunakan berdasarkan endpoint
 * @param {string} endpoint - API endpoint
 * @returns {string} URL backend yang akan digunakan
 */
export const getBackendUrlForEndpoint = (endpoint) => {
  // Fungsi helper untuk memeriksa apakah endpoint cocok dengan pola
  const matchesPattern = (pattern, endpoint) => {
    if (pattern === endpoint) return true;
    if (pattern.endsWith('*') && endpoint.startsWith(pattern.slice(0, -1))) return true;
    return false;
  };
  
  // Jika endpoint termasuk dalam MAIN_BACKEND_ENDPOINTS, gunakan backend utama
  if (MAIN_BACKEND_ENDPOINTS.some(pattern => matchesPattern(pattern, endpoint))) {
    return MAIN_BACKEND_URL;
  }
  
  // Jika endpoint termasuk dalam USER_BACKEND_ENDPOINTS, gunakan backend spesifik user
  if (USER_BACKEND_ENDPOINTS.some(pattern => matchesPattern(pattern, endpoint))) {
    // Ambil backend URL dari localStorage atau gunakan default
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.backend_url) {
          return user.backend_url;
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    
    // Jika backend URL tidak tersedia dari user, coba ambil dari localStorage
    const userBackendUrl = localStorage.getItem('userBackendUrl');
    if (userBackendUrl) {
      return userBackendUrl;
    }
  }
  
  // Default: gunakan backend utama
  return MAIN_BACKEND_URL;
};

/**
 * Fungsi untuk mendapatkan header autentikasi
 * @returns {Object} Header autentikasi
 */
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

/**
 * Konfigurasi untuk axios
 */
export const axiosConfig = {
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
};