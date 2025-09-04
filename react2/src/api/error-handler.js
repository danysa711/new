// src/api/error-handler.js

/**
 * Error handler untuk API calls
 * 
 * Memungkinkan aplikasi untuk tetap berjalan meski API error
 */

// Waktu tunggu antar retries (dalam ms)
const RETRY_DELAYS = [1000, 2000, 5000];

// Fungsi untuk melakukan retry API call dengan exponential backoff
export const callWithRetry = async (apiCall, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      console.warn(`API call gagal (percobaan ${attempt + 1}/${maxRetries + 1}):`, error);
      lastError = error;
      
      // Jika masih ada retries tersisa, tunggu sebelum mencoba lagi
      if (attempt < maxRetries) {
        const delay = RETRY_DELAYS[attempt] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // Jika semua retries gagal, throw error terakhir
  throw lastError;
};

// Fungsi untuk mengambil data dari API dengan fallback
export const fetchWithFallback = async (apiCall, fallbackData) => {
  try {
    return await callWithRetry(apiCall);
  } catch (error) {
    console.error("Semua percobaan API gagal, menggunakan data fallback:", error);
    return fallbackData;
  }
};

// Fungsi untuk melakukan API call dengan graceful error handling
export const safeApiCall = async (apiCall, fallbackData = null, errorHandler = null) => {
  try {
    return await apiCall();
  } catch (error) {
    console.error("API call error:", error);
    
    if (errorHandler) {
      errorHandler(error);
    }
    
    return fallbackData;
  }
};