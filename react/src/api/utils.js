// src/api/utils.js

import { STORAGE_KEYS } from './config';
import { detectDomainAndGenerateBackendUrl } from '../utils/domainUtils';

/**
 * Utilitas untuk API dan Storage
 */

// Mendapatkan URL backend aktif
export const getActiveBackendUrl = () => {
  try {
    // Coba dapatkan dari data user
    const userStr = localStorage.getItem(STORAGE_KEYS.USER) || sessionStorage.getItem(STORAGE_KEYS.USER);
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
  const savedBackendUrl = localStorage.getItem(STORAGE_KEYS.BACKEND_URL);
  if (savedBackendUrl) {
    return savedBackendUrl;
  }
  
  // Jika tidak ada yang tersimpan, gunakan URL berdasarkan domain saat ini
  return detectDomainAndGenerateBackendUrl();
};

// Mendapatkan token dari storage
export const getToken = () => {
  return localStorage.getItem(STORAGE_KEYS.TOKEN) || sessionStorage.getItem(STORAGE_KEYS.TOKEN);
};

// Mendapatkan refresh token dari storage
export const getRefreshToken = () => {
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
};

// Mendapatkan data user dari storage
export const getUserData = () => {
  try {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER) || sessionStorage.getItem(STORAGE_KEYS.USER);
    if (userStr) {
      return JSON.parse(userStr);
    }
  } catch (error) {
    console.error('Error parsing user data:', error);
  }
  return null;
};

// Menyimpan token berdasarkan remember preference
export const saveToken = (token, refreshToken = null) => {
  const remember = localStorage.getItem(STORAGE_KEYS.REMEMBER) === 'true';
  
  if (remember) {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    if (refreshToken) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }
  } else {
    sessionStorage.setItem(STORAGE_KEYS.TOKEN, token);
    if (refreshToken) {
      sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }
  }
};

// Menyimpan data user berdasarkan remember preference
export const saveUserData = (userData) => {
  const remember = localStorage.getItem(STORAGE_KEYS.REMEMBER) === 'true';
  
  if (remember) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
  } else {
    sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
  }
  
  // Jika ada backend_url, simpan juga di storage terpisah
  if (userData.backend_url) {
    localStorage.setItem(STORAGE_KEYS.BACKEND_URL, userData.backend_url);
  }
};

// Menghapus semua data autentikasi dari storage
export const clearAuthData = () => {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  sessionStorage.removeItem(STORAGE_KEYS.USER);
  // Jangan hapus BACKEND_URL agar tetap tersimpan untuk login berikutnya
};

// Format tampilan mata uang
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Format tampilan tanggal
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

// Format tampilan tanggal dan waktu
export const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};