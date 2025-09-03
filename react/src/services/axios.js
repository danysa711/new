// src/services/axios.js - Perbaikan konfigurasi Axios

import axios from "axios";

// Fungsi untuk mendapatkan backend URL
const getBackendUrl = () => {
  // Urutan prioritas:
  // 1. URL backend dari user yang sedang login (dari localStorage/sessionStorage)
  // 2. URL backend yang tersimpan di localStorage
  // 3. URL default dari environment variable
  const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
  let user = null;
  
  try {
    if (userStr) {
      user = JSON.parse(userStr);
    }
  } catch (err) {
    console.error("Error parsing user data:", err);
  }
  
  return user?.backend_url || 
         localStorage.getItem("backendUrl") || 
         import.meta.env.VITE_BACKEND_URL || 
         "https://db.kinterstore.my.id";
};

// Buat instance axios dengan baseURL yang dinamis
const axiosInstance = axios.create({
  timeout: 30000, // Turunkan timeout dari 90000 menjadi 30000 ms
  headers: {
    "Content-Type": "application/json",
  },
});

// Fungsi menyimpan token berdasarkan remember
const saveToken = (token, refreshToken) => {
  const remember = localStorage.getItem("remember") === "true"; // Ambil remember dari localStorage

  if (remember) {
    localStorage.setItem("token", token);
    refreshToken !== "" && localStorage.setItem("refreshToken", refreshToken);
  } else {
    sessionStorage.setItem("token", token);
    refreshToken !== "" && sessionStorage.setItem("refreshToken", refreshToken);
  }
};

// Fungsi mendapatkan token dari penyimpanan yang benar
const getStoredToken = () => {
  const remember = localStorage.getItem("remember") === "true";
  return remember ? localStorage.getItem("token") : sessionStorage.getItem("token");
};

const getStoredRefreshToken = () => {
  const remember = localStorage.getItem("remember") === "true";
  return remember ? localStorage.getItem("refreshToken") : sessionStorage.getItem("refreshToken");
};

// Bersihkan data autentikasi
const clearAuthData = () => {
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  sessionStorage.removeItem("refreshToken");
  // Jangan hapus data user dan backendUrl agar masih tersimpan untuk login berikutnya
};

// Tambahkan token dan baseURL ke setiap request
axiosInstance.interceptors.request.use(
  (config) => {
    // Set baseURL dinamis untuk setiap request
    config.baseURL = getBackendUrl();
    
    const token = getStoredToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    
    // Pastikan URL lengkap
    if (config.url && !config.url.startsWith('http')) {
      // Pastikan baseURL diakhiri dengan / jika url tidak dimulai dengan /
      if (!config.baseURL.endsWith('/') && !config.url.startsWith('/')) {
        config.url = '/' + config.url;
      }
    }
    
    // Untuk pencatatan
    console.log(`Permintaan ke ${config.baseURL}${config.url}`, {
      headers: config.headers,
      method: config.method
    });
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Cegah multiple refresh requests
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

const onRefreshed = (token) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

// Counter untuk retry otomatis
const maxRetries = 2;
const retryRequestsMap = new Map();

// Handling response error (refresh token jika access token expired)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Log error untuk debugging
    console.error(`Error response dari ${error.config?.url}:`, {
      status: error.response?.status,
      data: error.response?.data
    });
    
    const originalRequest = error.config;

     // Jika endpoint qris-payments error, dan ini bukan permintaan retry
    if (error.response?.status === 500 && 
        originalRequest.url.includes('/api/qris-payments') && 
        !originalRequest._isRetryQRIS) {

    // Tandai bahwa ini sudah dicoba untuk endpoint qris-payments
      originalRequest._isRetryQRIS = true;

    // Coba endpoint alternatif
      originalRequest.url = originalRequest.url.replace('/api/qris-payments', '/api/user/qris-payments');
      
      console.log(`Mencoba endpoint alternatif: ${originalRequest.url}`);
      return axiosInstance(originalRequest);
    }
    
    // PERBAIKAN: Cek apakah ini permintaan ke endpoint QRIS yang memerlukan autentikasi
    if (error.response?.status === 401 && originalRequest.url.includes('/qris-')) {
      // Jika user tidak terautentikasi, jangan retry
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        console.log('User belum login, tidak perlu retry untuk endpoint QRIS');
        return Promise.reject(error);
      }
    }
    
    // Cek apakah error terkait user dihapus
    if (error.response?.data?.code === "USER_DELETED") {
      console.warn("Akun pengguna telah dihapus");
      // Hapus semua data sesi
      clearAuthData();
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
      
      // Tampilkan pesan dan arahkan ke login
      alert('Akun Anda telah dihapus oleh admin.');
      window.location.href = "/login";
      return Promise.reject(error);
    }
    
    // Cek apakah error terkait langganan kedaluwarsa
    if (error.response?.data?.subscriptionRequired) {
      console.warn("Langganan kedaluwarsa");
      
      // Cek apakah user memiliki langganan aktif dalam storage
      const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          if (userData.hasActiveSubscription) {
            console.log("Pengguna memiliki langganan aktif di penyimpanan lokal, mencoba permintaan lagi");
            // Jika user memiliki langganan aktif dalam storage, coba lagi request
            return axiosInstance(originalRequest);
          }
        } catch (e) {
          console.error("Error parsing data pengguna:", e);
        }
      }
      
      // Biarkan halaman user menghandle pesan langganan
      return Promise.reject(error);
    }

    // Refresh token jika error 401 (Unauthorized)
    if (!refreshToken || refreshToken === 'undefined' || refreshToken === 'null') {
        console.warn("Refresh token tidak valid, mengarahkan ke login...");
      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        console.warn("Tidak ada refresh token, mengarahkan ke login...");
        clearAuthData();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            resolve(axiosInstance(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log("Mencoba refresh token...");
        
        // URL untuk refresh token dengan backend URL saat ini
        const currentBackendUrl = getBackendUrl();
        const refreshUrl = `${currentBackendUrl}/api/user/refresh`;
        
        // Kirim refresh token dengan timeout lebih lama
        const refreshResponse = await axios.post(
          refreshUrl, 
          { token: refreshToken }, 
          {
            headers: { "Content-Type": "application/json" },
            timeout: 15000 // 15 detik untuk refresh token
          }
        );
        
        console.log("Respons refresh token:", refreshResponse.data);

        const newAccessToken = refreshResponse.data.token;
        
        // Simpan token baru
        saveToken(newAccessToken, "");

        // Update header Authorization
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

        onRefreshed(newAccessToken);
        isRefreshing = false;

        // Retry permintaan asli dengan token baru
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.warn("Refresh token kedaluwarsa atau error:", refreshError);
        clearAuthData();
        
        // Arahkan ke halaman login dengan pesan
        alert('Sesi Anda telah berakhir. Silakan login kembali.');
        window.location.href = "/login";
        
        return Promise.reject(refreshError);
      }
    }

    // Untuk error 500, berikan pesan yang lebih informatif
    if (error.response?.status === 500) {
      console.error("Server error 500:", error.response?.data);
      // Tambahkan informasi tambahan pada error untuk ditampilkan di UI
      error.additionalInfo = "Terjadi kesalahan pada server. Silakan coba lagi nanti.";
    }

    return Promise.reject(error);
  }
);

// Fungsi khusus untuk orders/find yang lebih robust
export const findOrders = async (orderData, specificBackendUrl = null) => {
  try {
    // Gunakan backend URL yang spesifik jika disediakan, atau gunakan default
    const url = specificBackendUrl || getBackendUrl();
    
    console.log(`Mencari pesanan dengan backend URL: ${url}`);
    
    // Buat request langsung ke backend dengan error handling yang lebih baik
    const token = getStoredToken();
    if (!token) {
      throw new Error("Token tidak ditemukan. Silakan login kembali.");
    }
    
    const response = await axios.post(`${url}/api/orders/find`, orderData, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      timeout: 15000, // 15 detik timeout
    });
    
    return response.data;
  } catch (error) {
    console.error("Error mencari pesanan:", error);
    
    // Cek apakah ini masalah koneksi
    if (!error.response) {
      throw {
        message: "Gagal terhubung ke server. Periksa koneksi internet Anda."
      };
    }
    
    // Cek apakah ini masalah autentikasi
    if (error.response?.status === 401) {
      clearAuthData();
      window.location.href = "/login?expired=true";
      throw {
        message: "Sesi Anda telah berakhir. Silakan login kembali."
      };
    }
    
    // Error lainnya
    throw error;
  }
};

// Fungsi untuk test koneksi backend
export const testBackendConnection = async (url = null) => {
  const testUrl = url || getBackendUrl();
  try {
    // Gunakan endpoint /api/test yang seharusnya selalu tersedia
    const response = await axios.get(`${testUrl}/api/test`, {
      timeout: 10000
    });
    
    if (response.data && response.data.message === "API is working") {
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
      error: error.message,
      message: `Koneksi gagal: ${error.message}`
    };
  }
};

// Expose API URL constant
export const API_URL = getBackendUrl();
export const getApiUrl = getBackendUrl;

export default axiosInstance;