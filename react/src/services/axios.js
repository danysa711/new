// File: src/services/axios.js

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
    const currentBackendUrl = getBackendUrl();

     // Cek apakah response adalah HTML (biasanya menandakan error atau langganan kedaluwarsa)
    const contentType = error.response?.headers?.['content-type'] || '';
    if (contentType.includes('text/html')) {
      console.warn("Received HTML response instead of JSON, likely subscription expired");
      
      // Kembalikan error dengan format yang benar dan kode yang jelas
      return Promise.reject({
        response: {
          status: 403,
          data: {
            error: "Langganan kedaluwarsa",
            subscriptionRequired: true,
            message: "Koneksi ke API dinonaktifkan karena langganan Anda telah berakhir. Silakan perbarui langganan Anda."
          }
        }
      });
    }

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
      
      // Tampilkan pesan dan arahkan ke login
      alert('Akun Anda telah dihapus oleh admin.');
      window.location.href = "/login";
      return Promise.reject(error);
    }
    
    // Cek apakah error terkait langganan kedaluwarsa
    if (error.response?.data?.subscriptionRequired) {
      console.warn("Subscription expired");
      
      // Cek apakah user memiliki langganan aktif dalam storage
      const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
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
      
      // Jangan mengarahkan ulang ke halaman login, biarkan pengguna tetap di halaman user
      // Hanya perbarui status koneksi dan tampilkan notifikasi
      if (error.response.status === 403) {
        console.log('Langganan Kedaluwarsa: Koneksi ke API terputus karena langganan Anda telah berakhir.');
        // Tidak perlu menampilkan alert karena sudah ada banner di UI
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
        
        // URL untuk refresh token dengan backend URL saat ini
        const refreshUrl = `${currentBackendUrl}/api/user/refresh`;
        
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
        
        // Arahkan ke halaman login
        alert('Sesi Anda telah berakhir. Silakan login kembali.');
        window.location.href = "/login";
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Fungsi khusus untuk orders/find yang akan bekerja dengan backend URL spesifik
export const findOrders = async (orderData, specificBackendUrl = null) => {
  try {
    // Gunakan backend URL yang spesifik jika disediakan, atau gunakan default
    const url = specificBackendUrl || getBackendUrl();
    
    console.log(`Mencari pesanan dengan backend URL: ${url}`);
    
    // Buat request langsung ke backend yang ditentukan
    const response = await axios.post(`${url}/api/orders/find`, orderData, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getStoredToken()}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error("Error finding orders:", error);
    throw error;
  }
};

// Expose URL functions
export const API_URL = getBackendUrl();
export const getApiUrl = getBackendUrl;

export default axiosInstance;