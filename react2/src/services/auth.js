// File: src/services/auth.js

import axios from 'axios';
import { MAIN_BACKEND_URL } from './api-config';

/**
 * Alur Autentikasi:
 * 1. User login di backend utama
 * 2. Backend utama mengembalikan token dan informasi user (termasuk backend_url)
 * 3. Frontend menyimpan token dan backend_url
 * 4. Untuk permintaan API ke data user, frontend menggunakan backend_url spesifik user
 */

// Fungsi untuk login di backend utama
export const login = async (username, password) => {
  try {
    // Login ke backend utama
    const response = await axios.post(`${MAIN_BACKEND_URL}/api/login`, {
      username,
      password
    });
    
    const { token, refreshToken, user } = response.data;
    
    // Simpan token dan informasi user
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Pastikan backend_url tersimpan
    if (user.backend_url) {
      localStorage.setItem('userBackendUrl', user.backend_url);
    } else {
      // Jika user tidak memiliki backend_url, gunakan URL default
      localStorage.setItem('userBackendUrl', MAIN_BACKEND_URL);
    }
    
    return { success: true, user };
  } catch (error) {
    console.error('Login error:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Login failed'
    };
  }
};

// Fungsi untuk mendapatkan URL backend user
export const getUserBackendUrl = () => {
  // Urutan prioritas:
  // 1. URL backend spesifik user dari localStorage
  // 2. URL backend dari profil user
  // 3. URL backend utama
  const userBackendUrl = localStorage.getItem('userBackendUrl');
  
  if (userBackendUrl) {
    return userBackendUrl;
  }
  
  // Jika tidak ada userBackendUrl, coba ambil dari data user
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
  
  // Fallback ke backend utama
  return MAIN_BACKEND_URL;
};

// Fungsi untuk membuat permintaan ke backend spesifik user
export const makeUserBackendRequest = async (method, endpoint, data = null) => {
  try {
    const userBackendUrl = getUserBackendUrl();
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Token not found. Please login again.');
    }
    
    const config = {
      method,
      url: `${userBackendUrl}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    
    if (data && method.toLowerCase() !== 'get') {
      config.data = data;
    } else if (data && method.toLowerCase() === 'get') {
      config.params = data;
    }
    
    console.log(`Making ${method} request to user backend:`, userBackendUrl + endpoint);
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error making request to user backend:`, error);
    
    // Jika token tidak valid, arahkan ke login
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    throw error;
  }
};

// Fungsi khusus untuk pencarian orders pada backend user
export const findOrders = async (orderData) => {
  return makeUserBackendRequest('post', '/api/orders/find', orderData);
};

// Fungsi untuk logout
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('userBackendUrl');
  window.location.href = '/login';
};

// Fungsi untuk mendapatkan profil user dari backend utama
export const getUserProfile = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Token not found');
    }
    
    const response = await axios.get(`${MAIN_BACKEND_URL}/api/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const user = response.data.user;
    
    // Update data user di localStorage
    localStorage.setItem('user', JSON.stringify(user));
    
    // Update backend URL jika ada
    if (user.backend_url) {
      localStorage.setItem('userBackendUrl', user.backend_url);
    }
    
    return user;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      logout();
    }
    
    throw error;
  }
};