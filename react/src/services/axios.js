import axios from "axios";

// Variabel untuk mengontrol proses refresh token
let isRefreshing = false;
let refreshSubscribers = [];

// Antrian permintaan QRIS
const qrisRequestQueue = [];
let isProcessingQrisQueue = false;

// Fungsi untuk mendapatkan backend URL
const getBackendUrl = () => {
  try {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      if (userData.backend_url) {
        return userData.backend_url;
      }
    }
  } catch (error) {
    console.error('Error parsing user data:', error);
  }
  
  return localStorage.getItem('backendUrl') || 'https://db.kinterstore.my.id';
};

const getToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// Fungsi helper yang hilang
const clearAuthData = () => {
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  sessionStorage.removeItem("refreshToken");
};

const saveToken = (token, refreshToken) => {
  if (localStorage.getItem("remember") === "true") {
    localStorage.setItem("token", token);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
  } else {
    sessionStorage.setItem("token", token);
    if (refreshToken) sessionStorage.setItem("refreshToken", refreshToken);
  }
};

const getStoredToken = () => {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
};

const getStoredRefreshToken = () => {
  return localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken");
};

const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

const onRefreshed = (token) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

// Fungsi untuk menangani error rate limit
const handleRateLimitError = async (originalRequest, error) => {
  const retryAfter = parseInt(error.response?.headers?.['retry-after']) || 5;
  console.warn(`Rate limit terlampaui, mencoba lagi setelah ${retryAfter} detik...`);
  await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
  return axiosInstance(originalRequest);
};

// Fungsi untuk menangani upload QRIS yang gagal
const handleQrisUpload = async (originalRequest, error) => {
  console.warn("Upload QRIS gagal, mencoba dengan metode alternatif...");
  // Implementasi khusus untuk mengatasi error upload QRIS
  // Dalam kasus ini, kita akan mencoba menggunakan base64 jika tersedia dalam data originalRequest
  if (originalRequest.data && originalRequest.data instanceof FormData) {
    try {
      const formData = originalRequest.data;
      const file = formData.get('payment_proof');
      if (!file) throw new Error("File tidak ditemukan dalam FormData");
      
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      const base64Data = await base64Promise;
      const base64Content = base64Data.split(',')[1];
      
      // Mendapatkan reference dari URL
      const urlParts = originalRequest.url.split('/');
      const reference = urlParts[urlParts.indexOf('qris-payment') + 1];
      
      // Buat request baru dengan data base64
      const response = await axiosInstance.post(
        `/api/qris-payment/${reference}/upload-base64`,
        {
          payment_proof_base64: base64Content,
          file_type: file.type
        }
      );
      
      return response;
    } catch (e) {
      console.error("Gagal mencoba ulang dengan metode base64:", e);
      return Promise.reject(error);
    }
  }
  
  return Promise.reject(error);
};

// Fungsi untuk memproses antrian QRIS
const processQrisQueue = async () => {
  if (qrisRequestQueue.length === 0 || isProcessingQrisQueue) {
    return;
  }
  
  isProcessingQrisQueue = true;
  
  try {
    const { resolver, config } = qrisRequestQueue.shift();
    
    try {
      const response = await axios(config);
      resolver.resolve(response.data);
    } catch (error) {
      resolver.reject(error);
    }
  } finally {
    isProcessingQrisQueue = false;
    
    // Proses item berikutnya dalam antrian jika ada
    if (qrisRequestQueue.length > 0) {
      setTimeout(processQrisQueue, 500);
    }
  }
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
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
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
  (response) => {
    // Log success untuk debugging
    console.log(`QRIS Response success from ${response.config.url}`, {
      status: response.status,
      headers: response.headers,
      data: response.data ? 'Data ada' : 'Data kosong'
    });
    
    // Handle struktur respons yang berbeda-beda
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      // Kasus respons berstruktur: { data: [...], timestamp: ... }
      console.log('Respons QRIS memiliki struktur data dalam data');
      // Tetap kembalikan respons asli, transformasi dilakukan di service
    }
    
    return response;
  },
  async (error) => {
    return await handleQrisError(error);
  }
);

export const uploadPaymentProof = async (reference, file) => {
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

setInterval(autoRejectExpiredPayments, 15 * 60 * 1000);
// Fungsi-fungsi helper untuk operasi QRIS

// Mendapatkan pengaturan QRIS
export const getQrisSettings = async () => {
  try {
    // Coba beberapa endpoint yang berbeda
    const endpoints = [
      '/api/settings/qris-public',
      '/api/qris-settings/public',
      '/api/qris-settings?admin=true'
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Mencoba endpoint QRIS settings: ${endpoint}`);
        const response = await qrisInstance.get(endpoint);
        if (response.data) {
          console.log(`Berhasil mendapatkan data dari ${endpoint}`);
          return response.data;
        }
      } catch (err) {
        console.warn(`Gagal pada endpoint ${endpoint}:`, err);
      }
    }
    
    // Fallback jika semua endpoint gagal
    console.warn('Semua endpoint QRIS settings gagal, menggunakan data default');
    return {
      merchant_name: "Kinterstore",
      qris_image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAFAAQMAAAD3XjfpAAAABlBMVEX///8AAABVwtN+AAABA0lEQVRo3u2YMQ7DIAxFDRk5Qo7AUTgaR+loOQJHYKSImVTNH8fUVSvBwJs88Gfwl2MwEHweHEIoiqIoiqIoitqkL+p5tgAC+Cx4GGNc/kdc5QcRgA/CgwhAACCAAAIIIIB/CwaRAJ8QLwq+QwgggADuBS8KAQQQQDAF9ABmtbqzn6DUa3Yy8ipdV6t76aYN26xFR76yKTbecw5xg7XT0PTLna5YeVGrZqDT/mllTfG6Wdr9KE+5c5p+0xt0w7afMOvQPFQHbqiPmJqTjnGnJmK4epEQ74KDOPNeCnXngJ2KAu4XAL5fWGIbk8jm1+sA4D+CeywAAAQQQAABBBBAAKdlDkO5qQMRbkZBAAAAAElFTkSuQmCC",
      is_active: true,
      expiry_hours: 24,
      instructions: "Scan kode QR menggunakan aplikasi e-wallet atau mobile banking Anda."
    };
  } catch (error) {
    console.error("Error mendapatkan pengaturan QRIS:", error);
    // Tetap berikan data default untuk fallback UI
    return {
      merchant_name: "Kinterstore",
      qris_image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAFAAQMAAAD3XjfpAAAABlBMVEX///8AAABVwtN+AAABA0lEQVRo3u2YMQ7DIAxFDRk5Qo7AUTgaR+loOQJHYKSImVTNH8fUVSvBwJs88Gfwl2MwEHweHEIoiqIoiqIoitqkL+p5tgAC+Cx4GGNc/kdc5QcRgA/CgwhAACCAAAIIIIB/CwaRAJ8QLwq+QwgggADuBS8KAQQQQDAF9ABmtbqzn6DUa3Yy8ipdV6t76aYN26xFR76yKTbecw5xg7XT0PTLna5YeVGrZqDT/mllTfG6Wdr9KE+5c5p+0xt0w7afMOvQPFQHbqiPmJqTjnGnJmK4epEQ74KDOPNeCnXngJ2KAu4XAL5fWGIbk8jm1+sA4D+CeywAAAQQQAABBBBAAKdlDkO5qQMRbkZBAAAAAElFTkSuQmCC",
      is_active: true,
      expiry_hours: 24,
      instructions: "Scan kode QR menggunakan aplikasi e-wallet atau mobile banking Anda."
    };
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
    
    // Pastikan data yang dikembalikan adalah array
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return response.data.data; // Jika data dibungkus dalam objek { data: [...] }
    } else {
      console.warn("Respons QRIS payments bukan array, mengembalikan array kosong:", response.data);
      return []; // Default ke array kosong
    }
  } catch (error) {
    console.error("Error mendapatkan riwayat pembayaran QRIS:", error);
    return []; // Return array kosong jika error
  }
};

// Membuat instance axios biasa dengan baseURL dinamis
const axiosInstance = axios.create({
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  }
});

// Tambahkan token dan baseURL ke setiap request
axiosInstance.interceptors.request.use(
  (config) => {
    // Set baseURL dinamis
    config.baseURL = getBackendUrl();
    
    // Tambahkan token otentikasi
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Cek apakah ini adalah endpoint QRIS
    const isQrisEndpoint = config.url && (
      config.url.includes('/qris-payment') || 
      config.url.includes('/qris-settings') || 
      config.url.includes('/qris-payments')
    );
    
    if (isQrisEndpoint) {
      console.warn("Gunakan qrisInstance untuk endpoint QRIS!");
      // Tetap lanjutkan, tapi berikan warning
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Handling response error
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Logging error untuk debugging
    console.error("Axios error:", error.message || 'Unknown error');
    const originalRequest = error.config;

     if (error.response) {
      console.error(`Status: ${error.response.status}`, error.response.data);
    }

    // Jika ini adalah endpoint QRIS, berikan pesan khusus
    const isQrisEndpoint = error.config?.url && (
      error.config.url.includes('/qris-payment') || 
      error.config.url.includes('/qris-settings') || 
      error.config.url.includes('/qris-payments')
    );

    if (isQrisEndpoint) {
      console.warn("Gunakan qrisInstance untuk endpoint QRIS!");
      error.customMessage = "Gunakan qrisInstance untuk endpoint QRIS";
    }

    // Jika error 401 (Unauthorized), mungkin token perlu di-refresh
    if (error.response?.status === 401) {
      // Handle refresh token logic here if needed
      console.warn('Authentication error detected');
    }
    
    // Jika ini adalah endpoint QRIS, gunakan handler QRIS
    if (originalRequest && (
      originalRequest.url && (
        originalRequest.url.includes('/qris-payment') || 
        originalRequest.url.includes('/qris-settings') || 
        originalRequest.url.includes('/qris-payments')
      )
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

export { 
  uploadPaymentProof, 
  getQrisSettings, 
  createQrisPayment, 
  getQrisPayments,
  qrisInstance
};
export default axiosInstance;