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

// Buat instance axios khusus untuk QRIS dengan konfigurasi yang sesuai
export const qrisInstance = axios.create({
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
    "Accept": "*/*",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0"
  },
  withCredentials: true // Penting untuk CORS
});

// Tambahkan interceptor khusus untuk instance QRIS
qrisInstance.interceptors.request.use(
  (config) => {
    // Set baseURL dinamis
    config.baseURL = getBackendUrl();
    
    // Tambahkan token otentikasi
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    
    // Tambahkan timestamp ke URL untuk menghindari cache
    const separator = config.url.includes('?') ? '&' : '?';
    config.url = `${config.url}${separator}ts=${Date.now()}`;
    
    // Log request untuk debugging
    console.log(`QRIS Request ke ${config.baseURL}${config.url}`, {
      method: config.method,
      headers: { ...config.headers }
    });
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Fungsi helper untuk menangani error QRIS
const handleQrisError = async (error) => {
  console.error("Error QRIS:", error);
  
  // Jika error tidak memiliki respons (network error), tunggu dan coba lagi
  if (!error.response) {
    console.log("Kesalahan jaringan terdeteksi, mencoba lagi setelah 2 detik...");
    await new Promise(resolve => setTimeout(resolve, 2000));
    return qrisInstance(error.config);
  }
  
  // Jika error 429 (Too Many Requests), tunggu dan coba lagi
  if (error.response.status === 429) {
    const retryAfter = parseInt(error.response.headers['retry-after']) || 5;
    console.log(`Rate limit terlampaui, mencoba lagi setelah ${retryAfter} detik...`);
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
    return qrisInstance(error.config);
  }
  
  return Promise.reject(error);
};

// Tambahkan interceptor untuk respons
qrisInstance.interceptors.response.use(
  (response) => response,
  handleQrisError
);

// Fungsi-fungsi helper untuk operasi QRIS

// Mendapatkan pengaturan QRIS
export const getQrisSettings = async () => {
  try {
    const response = await qrisInstance.get("/api/qris-settings");
    return response.data;
  } catch (error) {
    console.error("Error mendapatkan pengaturan QRIS:", error);
    throw error;
  }
};

// Membuat pembayaran QRIS baru
export const createQrisPayment = async (planId) => {
  try {
    const response = await qrisInstance.post("/api/qris-payment", { plan_id: planId });
    return response.data;
  } catch (error) {
    console.error("Error membuat pembayaran QRIS:", error);
    throw error;
  }
};

// Upload bukti pembayaran QRIS
export const uploadQrisPaymentProof = async (reference, file) => {
  try {
    const formData = new FormData();
    formData.append("payment_proof", file);
    
    const response = await qrisInstance.post(`/api/qris-payment/${reference}/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    
    return response.data;
  } catch (error) {
    console.error("Error upload bukti pembayaran QRIS:", error);
    
    // Jika gagal dengan metode biasa, coba dengan base64
    try {
      console.log("Mencoba dengan metode base64...");
      
      // Baca file sebagai base64
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      const base64Data = await base64Promise;
      const base64Content = base64Data.split(',')[1]; // Ambil bagian base64 saja
      
      // Kirim sebagai JSON
      const response = await qrisInstance.post(`/api/qris-payment/${reference}/upload-base64`, {
        payment_proof_base64: base64Content,
        file_type: file.type
      });
      
      return response.data;
    } catch (base64Error) {
      console.error("Error upload dengan metode base64:", base64Error);
      throw base64Error;
    }
  }
};

// Mendapatkan riwayat pembayaran QRIS
export const getQrisPayments = async () => {
  try {
    const response = await qrisInstance.get("/api/qris-payments");
    return response.data;
  } catch (error) {
    console.error("Error mendapatkan riwayat pembayaran QRIS:", error);
    throw error;
  }
};

// Membuat instance axios biasa dengan baseURL dinamis
const axiosInstance = axios.create({
  timeout: 60000,
  headers: {
    "Content-Type": "application/json"
  }
});

// Tambahkan token dan baseURL ke setiap request
axiosInstance.interceptors.request.use(
  (config) => {
    // Set baseURL dinamis
    config.baseURL = getBackendUrl();
    
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    
    // Untuk endpoint QRIS, gunakan instance QRIS khusus
    if (config.url && (
      config.url.includes('/qris-payment') || 
      config.url.includes('/qris-settings') || 
      config.url.includes('/qris-payments')
    )) {
      console.warn("Gunakan qrisInstance untuk endpoint QRIS!");
      // Masih dilanjutkan, tapi berikan peringatan
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Handling response error
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Jika ini adalah endpoint QRIS, gunakan handler QRIS
    if (originalRequest && (
      originalRequest.url.includes('/qris-payment') || 
      originalRequest.url.includes('/qris-settings') || 
      originalRequest.url.includes('/qris-payments')
    )) {
      return handleQrisError(error);
    }
    
    // Jika tidak ada config, langsung reject
    if (!originalRequest) {
      return Promise.reject(error);
    }
    
    // Jika error adalah 429 (Too Many Requests)
    if (error.response?.status === 429) {
      console.warn("Terlalu banyak permintaan (429), menerapkan backoff...");
      return handleRateLimitError(originalRequest, error);
    }
    
    // Jika error adalah ERR_INSUFFICIENT_RESOURCES, tambahkan delay lebih lama dan retry
    if (error.response?.data?.error === 'ERR_INSUFFICIENT_RESOURCES') {
      console.warn('Kesalahan sumber daya server terdeteksi, mencoba ulang setelah penundaan...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      return axiosInstance(originalRequest);
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
    
    // Jika error adalah timeout atau network error dan masih bisa retry (maksimal 3 kali)
    if ((!error.response || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') 
        && retryCount < 3) {
      originalRequest._retryCount = retryCount + 1;
      
      // Tunggu dengan exponential backoff
      const delay = 1000 * Math.pow(2, retryCount);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      console.log(`Retry request ${retryCount + 1}/3 untuk: ${originalRequest.url}`);
      
      // Ubah timeout menjadi lebih lama untuk retry
      originalRequest.timeout = originalRequest.timeout || 30000;
      originalRequest.timeout += 15000; // Tambah 15 detik setiap retry
      
      // Tambahkan timestamp untuk mencegah cache
      if (originalRequest.url && !originalRequest.url.includes('ts=')) {
        const separator = originalRequest.url.includes('?') ? '&' : '?';
        originalRequest.url += `${separator}ts=${Date.now()}`;
      }
      
      return axiosInstance(originalRequest);
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
            headers: { 
              "Content-Type": "application/json",
              "Cache-Control": "no-cache" 
            },
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

// Fungsi khusus untuk QRIS payments yang bermasalah
export const qrisPaymentRequest = async (url, method, data = null, specificBackendUrl = null) => {
  const baseUrl = specificBackendUrl || getBackendUrl();
  const fullUrl = `${baseUrl}${url.startsWith('/') ? url : '/' + url}`;
  
  // Tambah timestamp untuk menghindari cache
  const timestampedUrl = fullUrl.includes('?') 
    ? `${fullUrl}&ts=${Date.now()}` 
    : `${fullUrl}?ts=${Date.now()}`;
  
  const token = getStoredToken();
  
  // Konfigurasi request
  const config = {
    url: timestampedUrl,
    method: method,
    headers: {
      "Authorization": token ? `Bearer ${token}` : '',
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    },
    timeout: 30000,
    withCredentials: true
  };
  
  if (data) {
    config.data = data;
  }
  
  // Gunakan sistem antrian untuk mencegah error rate limit
  return new Promise((resolve, reject) => {
    qrisRequestQueue.push({
      resolver: { resolve, reject },
      config
    });
    
    // Mulai proses antrian jika belum berjalan
    if (!isProcessingQrisQueue) {
      processQrisQueue();
    }
  });
};

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
    const maxRetries = 3; // Naikkan dari 2 ke 3 retry maksimal
    
    while (retries <= maxRetries) {
      try {
        // Tambahkan timestamp ke URL untuk mencegah cache
        const timestamp = Date.now();
        const response = await axios.post(`${url}/api/orders/find?ts=${timestamp}`, orderData, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache"
          },
          timeout: 20000, // 20 detik timeout, lebih panjang dari default
          withCredentials: true
        });
        
        return response.data;
      } catch (attemptError) {
        if (retries === maxRetries) {
          throw attemptError;
        }
        
        console.log(`Retry ${retries + 1}/${maxRetries} untuk orders/find...`);
        retries++;
        
        // Delay sebelum retry berikutnya (exponential backoff dengan jitter)
        const baseDelay = 1000 * Math.pow(2, retries - 1);
        const jitter = Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, baseDelay + jitter));
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
    // Tambahkan timestamp untuk mencegah cache
    const timestamp = Date.now();
    // Gunakan endpoint /api/test yang seharusnya selalu tersedia
    const response = await axios.get(`${testUrl}/api/test?ts=${timestamp}`, {
      timeout: 10000,
      headers: {
        "Cache-Control": "no-cache",
        "Pragma": "no-cache" 
      }
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