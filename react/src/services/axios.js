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
  timeout: 30000, // Timeout 30 detik
  headers: {
    "Content-Type": "application/json",
  },
});

// Fungsi menyimpan token berdasarkan remember
const saveToken = (token, refreshToken) => {
  const remember = localStorage.getItem("remember") === "true"; // Ambil remember dari localStorage

  if (remember) {
    localStorage.setItem("token", token);
    if (refreshToken && refreshToken !== "") {
      localStorage.setItem("refreshToken", refreshToken);
    }
  } else {
    sessionStorage.setItem("token", token);
    if (refreshToken && refreshToken !== "") {
      sessionStorage.setItem("refreshToken", refreshToken);
    }
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
    
    // Tambahkan parameter admin=true untuk endpoints admin
    if (config.url && (
      config.url.includes('/admin/') || 
      config.url.includes('?admin=true') ||
      config.url.includes('/qris-settings')
    )) {
      // Tambahkan parameter admin=true jika belum ada
      if (config.url.indexOf('?') === -1) {
        config.url += '?admin=true';
      } else if (config.url.indexOf('admin=true') === -1) {
        config.url += '&admin=true';
      }
    }
    
    // Pastikan URL lengkap
    if (config.url && !config.url.startsWith('http')) {
      // Pastikan baseURL diakhiri dengan / jika url tidak dimulai dengan /
      if (!config.baseURL.endsWith('/') && !config.url.startsWith('/')) {
        config.url = '/' + config.url;
      }
    }
    
    // Log untuk endpoints penting saja (kurangi noise)
    if (config.url && !config.url.includes('/api/test') && !config.url.startsWith('/api/settings/public')) {
      console.log(`Request ke ${config.baseURL}${config.url}`, {
        method: config.method,
        headers: { 
          "Content-Type": config.headers["Content-Type"],
          "Authorization": config.headers["Authorization"] ? "Bearer ****" : "none" // Sembunyikan token sebenarnya
        }
      });
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

// Counter untuk retry otomatis
const maxRetries = 2;
const retryRequestsMap = new Map();

// Fungsi khusus untuk retry request dengan exponential backoff
const retryRequest = async (originalRequest, retryCount = 0) => {
  const maxRetries = 2;
  if (retryCount >= maxRetries) {
    return Promise.reject(new Error(`Maximum retries (${maxRetries}) exceeded`));
  }
  
  // Tambahkan delay dengan exponential backoff
  const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s, ...
  await new Promise(resolve => setTimeout(resolve, delay));
  
  // Clone request dan tambahkan flag retry
  const newRequest = { ...originalRequest, _retryCount: retryCount + 1 };
  
  // Log retry untuk debugging
  console.log(`Retry request ${retryCount + 1}/${maxRetries} untuk: ${originalRequest.url}`);
  
  return axiosInstance(newRequest);
};

// Fungsi khusus untuk handle upload file QRIS
const handleQrisUpload = async (originalRequest, error) => {
  // Jika ini bukan error upload QRIS, lanjutkan ke handling normal
  if (!originalRequest.url?.includes('/qris-payment/') || 
      !originalRequest.url?.includes('/upload') ||
      originalRequest._isRetryUpload) {
    return Promise.reject(error);
  }
  
  console.log("Mencoba upload QRIS dengan format alternatif");
  
  // Tandai bahwa request ini sudah dicoba ulang
  originalRequest._isRetryUpload = true;
  
  // Jika ini adalah request FormData, coba format alternatif
  if (originalRequest.data instanceof FormData) {
    const formData = originalRequest.data;
    const file = formData.get('payment_proof');
    
    if (file) {
      try {
        // Buat reader untuk mengonversi file ke base64
        const reader = new FileReader();
        const filePromise = new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        const base64Data = await filePromise;
        const base64Content = base64Data.split(',')[1]; // Ambil bagian base64 saja
        
        // Modifikasi URL untuk endpoint alternatif
        let alternativeUrl = originalRequest.url;
        if (!alternativeUrl.includes('-base64')) {
          alternativeUrl = alternativeUrl.replace('/upload', '/upload-base64');
        }
        
        // Coba kirim sebagai JSON dengan base64
        const response = await axiosInstance.post(
          alternativeUrl,
          { 
            payment_proof_base64: base64Content,
            file_name: file.name,
            file_type: file.type
          }
        );
        
        return response;
      } catch (uploadError) {
        console.error("Error saat mengupload dengan format alternatif:", uploadError);
        // Jika masih gagal, coba dengan retryRequest biasa
        return retryRequest(originalRequest);
      }
    }
  }
  
  // Jika format alternatif tidak bisa digunakan, coba retry biasa
  return retryRequest(originalRequest);
};

// Handling response error (refresh token jika access token expired)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Jika tidak ada config (misal network error), langsung reject
    if (!originalRequest) {
      console.error("Network error atau request gagal tanpa config:", error);
      return Promise.reject(error);
    }
    
    // Ambil atau inisialisasi retry count
    const retryCount = originalRequest._retryCount || 0;
    
    // Log untuk error penting (kurangi noise)
    if (originalRequest.url && !originalRequest.url.includes('/api/test')) {
      console.error(`Error response dari ${originalRequest.baseURL || ''}${originalRequest.url}:`, {
        status: error.response?.status,
        data: error.response?.data,
        retryCount: retryCount
      });
    }
    
    // Khusus untuk upload QRIS yang gagal, coba dengan format alternatif
    if (error.response?.status === 500 &&
        originalRequest.url?.includes('/qris-payment/') && 
        originalRequest.url?.includes('/upload')) {
      return handleQrisUpload(originalRequest, error);
    }
    
    // Jika error adalah timeout atau network error dan masih bisa retry
    if ((!error.response || error.code === 'ECONNABORTED') && retryCount < maxRetries) {
      return retryRequest(originalRequest, retryCount);
    }
    
    // Cek apakah response adalah HTML (biasanya menandakan error atau langganan kedaluwarsa)
    const contentType = error.response?.headers?.['content-type'] || '';
    if (contentType.includes('text/html')) {
      console.warn("Menerima respons HTML bukan JSON, kemungkinan langganan kedaluwarsa atau error server");
      
      // Kembalikan error dengan format yang benar dan kode yang jelas
      return Promise.reject({
        response: {
          status: 403,
          data: {
            error: "Langganan kedaluwarsa atau error server",
            subscriptionRequired: true,
            message: "Koneksi ke API dinonaktifkan karena langganan Anda telah berakhir atau server error. Silakan periksa langganan Anda atau coba lagi nanti."
          }
        }
      });
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
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = getStoredRefreshToken();

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
        
        console.log("Respons refresh token diterima");

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
    
    // Implementasi retry untuk orders/find
    let retries = 0;
    const maxRetries = 2;
    
    while (retries <= maxRetries) {
      try {
        const response = await axios.post(`${url}/api/orders/find`, orderData, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          timeout: 15000 // 15 detik timeout
        });
        
        return response.data;
      } catch (attemptError) {
        if (retries === maxRetries) {
          throw attemptError;
        }
        
        console.log(`Retry ${retries + 1}/${maxRetries} untuk orders/find...`);
        retries++;
        
        // Delay sebelum retry berikutnya (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries - 1)));
      }
    }
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