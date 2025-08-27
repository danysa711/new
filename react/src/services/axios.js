// File: react/src/services/axios.js

import axios from "axios";

// Ambil URL backend dari localStorage atau env
export const API_URL = localStorage.getItem("backendUrl") || import.meta.env.VITE_BACKEND_URL || "http://localhost:3500";

// Buat instance axios dengan baseURL yang benar
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 90000,
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

// Tambahkan token ke setiap request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    
    // PERBAIKAN: Pastikan baseURL lengkap
    // Jika URL yang diminta tidak dimulai dengan http, tambahkan baseURL
    if (config.url && !config.url.startsWith('http')) {
      // Pastikan baseURL diakhiri dengan / jika url tidak dimulai dengan /
      if (!config.baseURL.endsWith('/') && !config.url.startsWith('/')) {
        config.url = '/' + config.url;
      }
    }
    
    // Untuk pencatatan
    console.log(`Permintaan ke ${config.url}`, {
      headers: config.headers,
      method: config.method,
      baseURL: config.baseURL
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

// Handling response error (refresh token jika access token expired)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Log untuk debugging
    console.error(`Error response from ${error.config?.url}:`, {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers
    });
    
    const originalRequest = error.config;

    // Cek apakah error terkait user dihapus
    if (error.response?.data?.code === "USER_DELETED") {
      console.warn("User account has been deleted");
      // Hapus semua data sesi
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      sessionStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
      localStorage.removeItem("remember");
      sessionStorage.removeItem("remember");
      
      // Tampilkan pesan
      if (typeof window !== 'undefined') {
        // Gunakan Modal dari antd untuk menampilkan pesan
        // Import ini perlu ditambahkan di bagian atas file
        const { Modal } = require('antd');
        Modal.warning({
          title: 'Akun Dihapus',
          content: 'Akun Anda telah dihapus oleh admin.',
          onOk() {
            window.location.href = "/login";
          }
        });
      } else {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }
    
    // Cek apakah error terkait langganan kedaluwarsa
    if (error.response?.data?.subscriptionRequired) {
      console.warn("Subscription expired");
      // Jangan mengarahkan ulang ke halaman login, biarkan pengguna tetap di halaman user
      // Hanya perbarui status koneksi dan tampilkan notifikasi
      if (error.response.status === 403) {
        try {
          const { notification } = require('antd');
          notification.warning({
            message: 'Langganan Kedaluwarsa',
            description: 'Koneksi ke API terputus karena langganan Anda telah berakhir. Beberapa fitur mungkin tidak berfungsi dengan baik. Silakan perbarui langganan Anda untuk mengakses semua fitur.',
            duration: 10,
          });
          
          // Update user state if needed
          if (typeof window !== 'undefined' && window.updateUserSubscriptionStatus) {
            window.updateUserSubscriptionStatus(false);
          }
        } catch (err) {
          console.error("Error handling subscription expired:", err);
        }
      }
      return Promise.reject(error);
    }

    // Refresh token jika error 401 atau 403
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      const refreshToken = getStoredRefreshToken();

      if (!refreshToken) {
        console.warn("No refresh token found, redirecting to login...");
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        sessionStorage.removeItem("refreshToken");
        localStorage.removeItem("remember");
        sessionStorage.removeItem("remember");
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
        console.log("Attempting to refresh token...");
        
        // URL untuk refresh token
        const refreshUrl = `${API_URL}/api/user/refresh`;
        
        const refreshResponse = await axios.post(refreshUrl, { token: refreshToken }, {
          headers: {
            "Content-Type": "application/json"
          }
        });
        
        console.log("Refresh token response:", refreshResponse.data);

        const newAccessToken = refreshResponse.data.token;
        
        // Save token based on remember preference
        saveToken(newAccessToken, "");

        // Update Authorization header
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

        onRefreshed(newAccessToken);
        isRefreshing = false;

        // Retry the original request with the new token
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.warn("Refresh token expired or error:", refreshError);
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        sessionStorage.removeItem("refreshToken");
        localStorage.removeItem("remember");
        sessionStorage.removeItem("remember");
        
        // Beri notifikasi kepada user
        try {
          const { notification } = require('antd');
          notification.error({
            message: 'Sesi Berakhir',
            description: 'Sesi Anda telah berakhir. Silakan login kembali.',
            duration: 5,
            onClose: () => {
              window.location.href = "/login";
            }
          });
        } catch (err) {
          window.location.href = "/login";
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;