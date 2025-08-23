import axios from "axios";

export const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3500";

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
  const remember = localStorage.getItem("remember") === "true";

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

// Function to parse JWT token
const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

// Tambahkan token ke setiap request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    
    // Identifikasi tipe request berdasarkan URL
    const url = config.url || '';
    if (url.includes('/software') || url.includes('/software-versions') || url.includes('/licenses')) {
      // Tambahkan header khusus untuk menandai request ke menu yang memerlukan langganan
      config.headers["X-Menu-Type"] = url.includes('/software') ? 'software' : 
                                     url.includes('/software-versions') ? 'version' : 
                                     'license';
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
  (response) => {
    // Jika respons berisi token baru, update
    if (response.data && response.data.token) {
      saveToken(response.data.token, "");
      
      // Parse dan periksa apakah status langganan telah berubah
      const decoded = parseJwt(response.data.token);
      if (decoded && typeof decoded.hasActiveSubscription !== 'undefined') {
        // Update data user dengan status langganan baru
        const remember = localStorage.getItem("remember") === "true";
        const storage = remember ? localStorage : sessionStorage;
        const userData = JSON.parse(storage.getItem("user") || "null");
        
        if (userData && userData.hasActiveSubscription !== decoded.hasActiveSubscription) {
          userData.hasActiveSubscription = decoded.hasActiveSubscription;
          storage.setItem("user", JSON.stringify(userData));
          
          // Notify components about the update
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('userDataUpdated', {
              detail: { user: userData }
            }));
          }
        }
      }
    }
    
    return response;
  },
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
      
      // Update user subscription status in local storage/session
      try {
        const token = getStoredToken();
        if (token) {
          const decoded = parseJwt(token);
          if (decoded) {
            // Read current user data
            const remember = localStorage.getItem("remember") === "true";
            const storage = remember ? localStorage : sessionStorage;
            const userData = JSON.parse(storage.getItem("user") || "null");
            
            if (userData) {
              // Update the subscription status
              userData.hasActiveSubscription = false;
              storage.setItem("user", JSON.stringify(userData));
              
              // Dispatch a custom event to notify components
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('userDataUpdated', {
                  detail: { user: userData }
                }));
              }
              
              // Show notification
              const { notification } = require('antd');
              const menuType = originalRequest.headers["X-Menu-Type"];
              
              notification.warning({
                message: 'Langganan Kedaluwarsa',
                description: menuType ? 
                  `Koneksi ke menu ${menuType === 'software' ? 'Produk' : menuType === 'version' ? 'Variasi Produk' : 'Stok'} terputus karena langganan Anda telah berakhir.` : 
                  'Koneksi ke API terputus karena langganan Anda telah berakhir. Beberapa fitur mungkin tidak berfungsi dengan baik. Silakan perbarui langganan Anda untuk mengakses semua fitur.',
                duration: 10,
              });
              
              // Update status koneksi menu jika tersedia
              if (typeof window !== 'undefined' && menuType) {
                window.updateMenuConnectionStatus(menuType, 'disconnected');
              }
            }
          }
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
        
        // Get updated subscription status from token
        const decoded = parseJwt(newAccessToken);
        if (decoded && typeof decoded.hasActiveSubscription !== 'undefined') {
          // Update user data with new subscription status
          const remember = localStorage.getItem("remember") === "true";
          const storage = remember ? localStorage : sessionStorage;
          const userData = JSON.parse(storage.getItem("user") || "null");
          
          if (userData) {
            userData.hasActiveSubscription = decoded.hasActiveSubscription;
            storage.setItem("user", JSON.stringify(userData));
            
            // Notify components about the update
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('userDataUpdated', {
                detail: { user: userData }
              }));
            }
          }
        }
        
        saveToken(newAccessToken, "");
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

// Expose updateMenuConnectionStatus function globally
if (typeof window !== 'undefined') {
  window.updateMenuConnectionStatus = (menuType, status) => {
    const event = new CustomEvent('menuConnectionStatusChanged', { 
      detail: { menuType, status } 
    });
    window.dispatchEvent(event);
  };
  
  // Add function to update user subscription status
  window.updateUserSubscriptionStatus = (hasActiveSubscription) => {
    const remember = localStorage.getItem("remember") === "true";
    const storage = remember ? localStorage : sessionStorage;
    const userData = JSON.parse(storage.getItem("user") || "null");
    
    if (userData) {
      userData.hasActiveSubscription = hasActiveSubscription;
      storage.setItem("user", JSON.stringify(userData));
      
      // Notify components about the update
      window.dispatchEvent(new CustomEvent('userDataUpdated', {
        detail: { user: userData }
      }));
    }
  };
}

export default axiosInstance;