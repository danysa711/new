// File: api/connection-manager.js

import { getActiveBackendUrl, testBackendConnection, updateBackendUrl } from './api-adapter.js';

/**
 * Connection Manager - Mengelola koneksi ke backend
 * 
 * Menyediakan fungsi dan event untuk:
 * 1. Memantau status koneksi
 * 2. Mendeteksi masalah koneksi
 * 3. Menyediakan informasi koneksi untuk UI
 */

// Status koneksi yang mungkin
export const CONNECTION_STATUS = {
  CHECKING: 'checking',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
  SUBSCRIPTION_EXPIRED: 'subscription_expired'
};

// Membuat event emitter untuk status koneksi
class ConnectionEventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return () => this.off(event, listener);
  }

  off(event, listener) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  emit(event, ...args) {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => listener(...args));
  }
}

// Buat instance event emitter
export const connectionEvents = new ConnectionEventEmitter();

// Status koneksi saat ini
let currentStatus = CONNECTION_STATUS.CHECKING;
let lastChecked = null;
let checkInterval = null;

// Mendapatkan status koneksi saat ini
export const getConnectionStatus = () => {
  return {
    status: currentStatus,
    lastChecked,
    backendUrl: getActiveBackendUrl()
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
  updateStatus(CONNECTION_STATUS.CHECKING);
  
  // Lakukan pengujian koneksi
  const result = await testBackendConnection();
  
  // Perbarui status berdasarkan hasil pengujian
  if (result.success) {
    updateStatus(CONNECTION_STATUS.CONNECTED);
  } else if (result.error === 'subscription_expired') {
    updateStatus(CONNECTION_STATUS.SUBSCRIPTION_EXPIRED);
  } else {
    updateStatus(CONNECTION_STATUS.ERROR);
  }
  
  return getConnectionStatus();
};

// Memperbarui status koneksi
export const updateStatus = (status) => {
  currentStatus = status;
  lastChecked = new Date();
  connectionEvents.emit('statusChanged', getConnectionStatus());
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

// Memperbarui URL backend dan memeriksa koneksi
export const changeBackendUrl = async (newUrl) => {
  const result = await updateBackendUrl(newUrl);
  if (result.success) {
    await checkConnection(true);
  }
  return result;
};

// Inisialisasi pemeriksaan koneksi saat modul dimuat
checkConnection(true);