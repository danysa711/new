import axios from "axios";

export const API_URL = localStorage.getItem("backendUrl") || import.meta.env.VITE_BACKEND_URL || "http://localhost:3500";

console.log("Using API URL:", API_URL);

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
      
      // Update user status in localStorage/sessionStorage
      try {
        const remember = localStorage.getItem("remember") === "true";
        const userStr = remember ? localStorage.getItem("user") : sessionStorage.getItem("user");
        
        if (userStr) {
          const userData = JSON.parse(userStr);
          userData.hasActiveSubscription = false;
          
          if (remember) {
            localStorage.setItem("user", JSON.stringify(userData));
          } else {
            sessionStorage.setItem("user", JSON.stringify(userData));
          }
          
          // Update user state via window object (temporary solution)
          if (typeof window !== 'undefined' && window.updateUserSubscriptionStatus) {
            window.updateUserSubscriptionStatus(false);
          }
          
          // Trigger UI update notification
          const { notification } = require('antd');
          notification.warning({
            message: 'Langganan Kedaluwarsa',
            description: 'Koneksi ke API terputus karena langganan Anda telah berakhir. Beberapa fitur mungkin tidak berfungsi dengan baik. Silakan perbarui langganan Anda untuk mengakses semua fitur.',
            duration: 10,
          });
        }
      } catch (err) {
        console.error("Error handling subscription expired:", err);
      }
      return Promise.reject(error);
    }

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
        const refreshResponse = await axios.post(`${API_URL}/api/user/refresh`, { token: refreshToken });

        const newAccessToken = refreshResponse.data.token;
        // const newRefreshToken = refreshResponse.data.refreshToken;

        // saveToken(newAccessToken, newRefreshToken); // Simpan token sesuai remember
        saveToken(newAccessToken, ""); // Simpan token sesuai remember

        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

        onRefreshed(newAccessToken);
        isRefreshing = false;

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.warn("Refresh token expired, redirecting to login...");
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        sessionStorage.removeItem("refreshToken");
        localStorage.removeItem("remember");
        sessionStorage.removeItem("remember");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;