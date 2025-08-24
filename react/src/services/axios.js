import axios from "axios";

export const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3500";

console.log("Using API URL:", API_URL);

// Default settings untuk digunakan saat API gagal
const DEFAULT_SETTINGS = {
  whatsapp: {
    phone: "6281234567890",
    message: "Halo, saya {username} ({email}) ingin {purpose}. URL Slug: {url_slug}"
  },
  company: {
    name: "Kinterstore",
    address: "Jakarta, Indonesia",
    email: "info@kinterstore.my.id"
  }
};

const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 90000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Cache for storing responses
const responseCache = new Map();

// Helper functions for localStorage
const getLocalStorage = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (e) {
    console.error(`Error reading from localStorage (${key}):`, e);
    return defaultValue;
  }
};

const setLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`Error writing to localStorage (${key}):`, e);
    return false;
  }
};

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
    
    // Use cache for GET requests to critical endpoints
    const isCriticalEndpoint = url.includes('/api/settings') || 
                              url.includes('/api/subscriptions/user') ||
                              url.includes('/api/user/profile');
    
    // Set cache flag for response interceptor
    if (config.method === 'get' && isCriticalEndpoint) {
      config.useCachedResponse = true;
      
      // Check if we have a valid cached response
      const cacheKey = `${config.method}:${config.url}`;
      const cachedResponse = responseCache.get(cacheKey);
      
      if (cachedResponse && Date.now() < cachedResponse.expiry) {
        // Create a new promise that resolves with the cached data
        const source = axios.CancelToken.source();
        config.cancelToken = source.token;
        
        // Cancel the request and use cached data
        setTimeout(() => {
          source.cancel(`Using cached response for ${config.url}`);
        }, 0);
        
        // Attach cached response to be used in response interceptor
        config.cachedResponse = cachedResponse.data;
      }
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
          console.log('Subscription status changed:', 
            userData.hasActiveSubscription ? 'active → inactive' : 'inactive → active');
          
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
    
    // Cache critical GET responses
    if (response.config.method === 'get' && response.config.useCachedResponse) {
      const cacheKey = `${response.config.method}:${response.config.url}`;
      responseCache.set(cacheKey, {
        data: response.data,
        expiry: Date.now() + (30 * 60 * 1000) // Cache for 30 minutes
      });
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If the request was cancelled to use cached data
    if (axios.isCancel(error) && error.message.includes('Using cached response')) {
      return Promise.resolve({
        data: error.config.cachedResponse,
        status: 200,
        statusText: 'OK (Cached)',
        headers: {},
        config: error.config,
        cached: true
      });
    }

    // Tambahkan penanganan timeout dan error koneksi
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout') || error.code === 'ERR_NETWORK') {
      console.warn('Network error or timeout, retrying...', error.message);
      
      // Coba lagi dengan timeout yang lebih lama jika ini adalah request pertama
      if (!originalRequest._retryCount) {
        originalRequest._retryCount = 1;
        originalRequest.timeout = originalRequest.timeout * 1.5; // Perpanjang timeout
        return axiosInstance(originalRequest);
      } else if (originalRequest._retryCount < 3) { // Coba maksimal 3 kali
        originalRequest._retryCount += 1;
        return axiosInstance(originalRequest);
      }
      
      // Jika sudah mencoba 3 kali dan masih gagal, tampilkan notifikasi
      if (typeof window !== 'undefined') {
        try {
          const { notification } = await import('antd');
          notification.error({
            message: 'Masalah Koneksi',
            description: 'Tidak dapat terhubung ke server. Silakan periksa koneksi internet Anda dan coba lagi.',
            duration: 10,
          });
        } catch (e) {
          console.error("Failed to show notification:", e);
        }
      }
    }
    
    // For critical endpoints with 403 errors, try to use cached data
    if (error.response?.status === 403) {
      const config = error.config;
      const isCriticalEndpoint = config.url.includes('/api/settings') || 
                               config.url.includes('/api/subscriptions/user') ||
                               config.url.includes('/api/user/profile');
      
      if (config.method === 'get' && isCriticalEndpoint) {
        const cacheKey = `${config.method}:${config.url}`;
        const cachedResponse = responseCache.get(cacheKey);
        
        if (cachedResponse) {
          console.log(`Using cached response for ${config.url} due to 403 error`);
          return Promise.resolve({
            data: cachedResponse.data,
            status: 200,
            statusText: 'OK (Cached)',
            headers: {},
            config: config,
            cached: true
          });
        }
        
        // If no cache available, fallback to default values
        if (config.url.includes('/api/settings')) {
          // Use hardcoded DEFAULT_SETTINGS instead of require
          return Promise.resolve({
            data: DEFAULT_SETTINGS,
            status: 200,
            statusText: 'OK (Default)',
            headers: {},
            config: config,
            default: true
          });
        }
        
        // Handle subscription endpoint fallback
        if (config.url.includes('/api/subscriptions/user')) {
          // Check if we have subscription data in localStorage
          const storedSubscription = getLocalStorage('user_subscription', null);
          if (storedSubscription) {
            return Promise.resolve({
              data: [storedSubscription],
              status: 200,
              statusText: 'OK (LocalStorage)',
              headers: {},
              config: config,
              default: true
            });
          }
        }
      }
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
      
      // Tampilkan pesan
      if (typeof window !== 'undefined') {
        try {
          const { Modal } = await import('antd');
          Modal.warning({
            title: 'Akun Dihapus',
            content: 'Akun Anda telah dihapus oleh admin.',
            onOk() {
              window.location.href = "/login";
            }
          });
        } catch (e) {
          console.error("Failed to show modal:", e);
          window.location.href = "/login";
        }
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
                
                window.dispatchEvent(new CustomEvent('subscriptionStatusChanged', { 
                  detail: { status: 'expired' } 
                }));
              }
              
              // Show notification
              try {
                const { notification } = await import('antd');
                const menuType = originalRequest.headers["X-Menu-Type"];
                
                notification.warning({
                  message: 'Langganan Kedaluwarsa',
                  description: menuType ? 
                    `Koneksi ke menu ${menuType === 'software' ? 'Produk' : menuType === 'version' ? 'Variasi Produk' : 'Stok'} terputus karena langganan Anda telah berakhir.` : 
                    'Koneksi ke API terputus karena langganan Anda telah berakhir. Beberapa fitur mungkin tidak berfungsi dengan baik. Silakan perbarui langganan Anda untuk mengakses semua fitur.',
                  duration: 10,
                });
              } catch (e) {
                console.error("Failed to show notification:", e);
              }
              
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
      
      // Untuk URL yang seharusnya bisa diakses tanpa langganan aktif
      // Coba akses dengan rute alternatif
      const url = originalRequest.url;
      if (url.includes('/api/settings') || url.includes('/api/subscriptions/user') || url.includes('/api/user/profile')) {
        console.log("Trying alternative access for:", url);
        // Jangan tolak error, coba ulang request
        delete originalRequest.headers["X-Menu-Type"];
        return axiosInstance(originalRequest);
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