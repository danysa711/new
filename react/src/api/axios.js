// src/api/axios.js

import axios from 'axios';
import { REQUEST_TIMEOUT, STORAGE_KEYS } from './config';
import { getActiveBackendUrl, getToken, getRefreshToken, saveToken, clearAuthData } from './utils';

/**
 * Konfigurasi dan instans axios untuk request API
 */

// Buat instance axios dengan konfigurasi dasar
const axiosInstance = axios.create({
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Cegah multiple refresh requests
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

const onRefreshed = (token) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

// Tambahkan interceptor untuk request
axiosInstance.interceptors.request.use(
  (config) => {
    // Set baseURL dinamis untuk setiap request
    config.baseURL = getActiveBackendUrl();
    
    // Tambahkan token ke header jika tersedia
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Pastikan URL lengkap
    if (config.url && !config.url.startsWith('http')) {
      // Pastikan baseURL diakhiri dengan / jika url tidak dimulai dengan /
      if (!config.baseURL.endsWith('/') && !config.url.startsWith('/')) {
        config.url = '/' + config.url;
      }
    }
    
    // Log untuk debugging
    console.log(`Request ke ${config.baseURL}${config.url}`, {
      method: config.method,
      headers: config.headers
    });
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Tambahkan interceptor untuk response
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Log error untuk debugging
    console.error(`Error response from ${error.config?.url}:`, {
      status: error.response?.status,
      data: error.response?.data
    });
    
    const originalRequest = error.config;
    
    // Cek apakah error terkait user dihapus
    if (error.response?.data?.code === "USER_DELETED") {
      console.warn("User account has been deleted");
      clearAuthData();
      
      // Tampilkan pesan dan arahkan ke login
      alert('Akun Anda telah dihapus oleh admin.');
      window.location.href = "/login";
      return Promise.reject(error);
    }
    
    // Cek apakah error terkait langganan kedaluwarsa
    if (error.response?.data?.subscriptionRequired) {
      console.warn("Subscription expired");
      
      // Cek apakah user memiliki langganan aktif dalam storage
      const userStr = localStorage.getItem(STORAGE_KEYS.USER) || sessionStorage.getItem(STORAGE_KEYS.USER);
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          if (userData.hasActiveSubscription) {
            console.log("User has active subscription in local storage, retrying request");
            // Jika user memiliki langganan aktif dalam storage, coba lagi request
            return axiosInstance(originalRequest);
          }
        } catch (e) {
          console.error("Error parsing user data:", e);
        }
      }
      
      // Biarkan error terus tanpa mengarahkan ke login
      return Promise.reject(error);
    }
    
    // Refresh token jika error 401 (Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = getRefreshToken();
      
      if (!refreshToken) {
        console.warn("No refresh token found, redirecting to login...");
        clearAuthData();
        window.location.href = "/login";
        return Promise.reject(error);
      }
      
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            resolve(axiosInstance(originalRequest));
          });
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        console.log("Attempting to refresh token...");
        
        // URL untuk refresh token dengan backend URL saat ini
        const refreshUrl = `${getActiveBackendUrl()}/api/user/refresh`;
        
        const refreshResponse = await axios.post(refreshUrl, 
          { token: refreshToken }, 
          { headers: { 'Content-Type': 'application/json' } }
        );
        
        console.log("Refresh token response:", refreshResponse.data);
        
        const newAccessToken = refreshResponse.data.token;
        
        // Simpan token baru
        saveToken(newAccessToken, "");
        
        // Update header Authorization
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        
        onRefreshed(newAccessToken);
        isRefreshing = false;
        
        // Retry original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.warn("Refresh token expired or error:", refreshError);
        clearAuthData();
        
        // Redirect to login
        alert('Sesi Anda telah berakhir. Silakan login kembali.');
        window.location.href = "/login";
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Fungsi khusus untuk mencari pesanan
export const findOrders = async (orderData, specificBackendUrl = null) => {
  try {
    // Gunakan backend URL yang spesifik jika disediakan, atau gunakan default
    const url = specificBackendUrl || getActiveBackendUrl();
    
    console.log(`Mencari pesanan dengan backend URL: ${url}`);
    
    const response = await axiosInstance.post('/api/orders/find', orderData);
    return response.data;
  } catch (error) {
    console.error("Error finding orders:", error);
    throw error;
  }
};

// Expose API URL constant
export const API_URL = getActiveBackendUrl();

export default axiosInstance;