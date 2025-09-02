// src/api/auth-service.js

import axiosInstance from './axios';
import { STORAGE_KEYS, API_ENDPOINTS } from './config';
import { saveToken, saveUserData, clearAuthData, getActiveBackendUrl } from './utils';

/**
 * Service untuk autentikasi dan manajemen user
 */

// Login user
export const login = async (username, password, remember = false) => {
  try {
    // Simpan remember preference
    localStorage.setItem(STORAGE_KEYS.REMEMBER, remember.toString());
    
    const response = await axiosInstance.post(API_ENDPOINTS.LOGIN, { username, password });
    
    const { token, refreshToken, user } = response.data;
    
    // Simpan token dan user data
    saveToken(token, refreshToken);
    saveUserData(user);
    
    return { success: true, user };
  } catch (error) {
    console.error('Login error:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Login failed'
    };
  }
};

// Register user baru
export const register = async (username, email, password) => {
  try {
    const response = await axiosInstance.post(API_ENDPOINTS.REGISTER, { 
      username, 
      email, 
      password 
    });
    
    const { token, refreshToken, user } = response.data;
    
    // Simpan token dan user data
    saveToken(token, refreshToken);
    saveUserData(user);
    
    return { success: true, user };
  } catch (error) {
    console.error('Register error:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Registration failed'
    };
  }
};

// Logout user
export const logout = () => {
  clearAuthData();
  window.location.href = '/login';
};

// Mendapatkan profil user
export const getUserProfile = async () => {
  try {
    const response = await axiosInstance.get(API_ENDPOINTS.USER_PROFILE);
    
    // Update user data di storage
    saveUserData(response.data.user);
    
    return response.data.user;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      logout();
    }
    
    throw error;
  }
};

// Verifikasi password user
export const verifyPassword = async (password) => {
  try {
    const response = await axiosInstance.post(API_ENDPOINTS.VERIFY_PASSWORD, { password });
    return { success: true, message: response.data.message };
  } catch (error) {
    console.error('Error verifying password:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Password verification failed'
    };
  }
};

// Update password user
export const updatePassword = async (currentPassword, newPassword) => {
  try {
    const response = await axiosInstance.put(API_ENDPOINTS.UPDATE_USER, {
      currentPassword,
      newPassword
    });
    
    return { success: true, message: response.data.message };
  } catch (error) {
    console.error('Error updating password:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Password update failed'
    };
  }
};

// Update backend URL
export const updateBackendUrl = async (backendUrl) => {
  try {
    // Validasi URL
    if (!backendUrl.match(/^https?:\/\/.+/)) {
      return { 
        success: false, 
        error: 'URL backend tidak valid. Harus dimulai dengan http:// atau https://'
      };
    }
    
    // Simpan di localStorage
    localStorage.setItem(STORAGE_KEYS.BACKEND_URL, backendUrl);
    
    // Update di server jika user terautentikasi
    const response = await axiosInstance.put(API_ENDPOINTS.BACKEND_URL, { backend_url: backendUrl });
    
    // Update user data di storage
    const userData = response.data.user || (await getUserProfile());
    saveUserData(userData);
    
    return { success: true, message: 'URL backend berhasil diperbarui' };
  } catch (error) {
    console.error('Error updating backend URL:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Failed to update backend URL'
    };
  }
};

// Test koneksi ke backend
export const testBackendConnection = async (url = null) => {
  try {
    const testUrl = url || getActiveBackendUrl();
    const response = await axiosInstance.get(API_ENDPOINTS.TEST, {
      baseURL: testUrl
    });
    
    if (response.data && response.data.message === "API is working") {
      return { success: true, message: "Koneksi berhasil" };
    }
    
    return { 
      success: false, 
      error: 'Invalid response from backend',
      message: "Respons tidak valid dari backend" 
    };
  } catch (error) {
    console.error("Connection test failed:", error);
    return {
      success: false,
      error: error.message,
      message: `Koneksi gagal: ${error.message}`
    };
  }
};