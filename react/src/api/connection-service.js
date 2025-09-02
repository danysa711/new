// src/api/connection-service.js

import { testBackendConnection } from './auth-service';
import { getActiveBackendUrl } from './utils';
import { CONNECTION_STATUS } from './config';

/**
 * Service untuk mengelola koneksi ke backend
 */

// Status koneksi saat ini
let currentStatus = CONNECTION_STATUS.CHECKING;
let lastChecked = null;
let checkInterval = null;
let connectionListeners = [];

// Mendapatkan status koneksi saat ini
export const getConnectionStatus = () => {
  return {
    status: currentStatus,
    lastChecked,
    backendUrl: getActiveBackendUrl()
  };
};

// Memperbarui status koneksi
export const updateConnectionStatus = (status) => {
  currentStatus = status;
  lastChecked = new Date();
  
  // Panggil semua listener
  connectionListeners.forEach(listener => {
    try {
      listener(getConnectionStatus());
    } catch (error) {
      console.error('Error in connection listener:', error);
    }
  });
};

// Menambahkan listener untuk perubahan status koneksi
export const addConnectionListener = (listener) => {
  connectionListeners.push(listener);
  return () => {
    connectionListeners = connectionListeners.filter(l => l !== listener);
  };
};

// Memeriksa koneksi ke backend
export const checkConnection = async (force = false) => {
  // Jika baru saja diperiksa (kurang dari 10 detik) dan tidak dipaksa, lewati
  const now = new Date();
  if (!force && lastChecked && (now - lastChecked) < 10000) {
    return getConnectionStatus();
  }
  
  // Perbarui status menjadi "checking"
  updateConnectionStatus(CONNECTION_STATUS.CHECKING);
  
  try {
    // Lakukan pengujian koneksi
    const result = await testBackendConnection();
    
    // Perbarui status berdasarkan hasil pengujian
    if (result.success) {
      updateConnectionStatus(CONNECTION_STATUS.CONNECTED);
    } else {
      updateConnectionStatus(CONNECTION_STATUS.ERROR);
    }
  } catch (error) {
    // Periksa apakah error terkait langganan kedaluwarsa
    if (error.response?.data?.subscriptionRequired) {
      updateConnectionStatus(CONNECTION_STATUS.SUBSCRIPTION_EXPIRED);
    } else {
      updateConnectionStatus(CONNECTION_STATUS.ERROR);
    }
  }
  
  return getConnectionStatus();
};

// Memulai pemeriksaan koneksi berkala
export const startConnectionMonitoring = (intervalMs = 60000) => {
  stopConnectionMonitoring();
  checkConnection(true);
  checkInterval = setInterval(() => checkConnection(), intervalMs);
  return () => stopConnectionMonitoring();
};

// Menghentikan pemeriksaan koneksi berkala
export const stopConnectionMonitoring = () => {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
};