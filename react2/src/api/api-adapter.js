// File: api/api-adapter.js

/**
 * API Adapter - Modul untuk menghubungkan frontend dengan berbagai backend
 */

// Fungsi untuk mendapatkan URL backend yang aktif
export const getActiveBackendUrl = () => {
  // Prioritas: URL backend dari user aktif > URL backend yang tersimpan > URL default
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

// Fungsi untuk mendapatkan token autentikasi
export const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// Fungsi untuk mendapatkan token refresh
export const getRefreshToken = () => {
  return localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
};

// Fungsi untuk membuat headers dengan autentikasi
export const createAuthHeaders = () => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Fungsi untuk fetch dengan timeout dan otentikasi
export const fetchWithAuth = async (endpoint, options = {}) => {
  const backendUrl = getActiveBackendUrl();
  const url = `${backendUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  
  // Tambahkan timestamp untuk menghindari caching
  const timestampedEndpoint = endpoint.includes('?') 
    ? `${endpoint}&_ts=${Date.now()}` 
    : `${endpoint}?_ts=${Date.now()}`;
  
  const timestampedUrl = `${backendUrl}${timestampedEndpoint.startsWith('/') ? timestampedEndpoint : '/' + timestampedEndpoint}`;
  
  // Gabungkan headers default dengan headers kustom
  const headers = {
    ...createAuthHeaders(),
    ...options.headers
  };
  
  // Set timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  try {
    console.log(`Requesting ${options.method || 'GET'} ${timestampedUrl}`);
    
    const response = await fetch(timestampedUrl, {
      ...options,
      headers,
      signal: controller.signal
    });
    
    // Log untuk debugging
    console.log(`Response status for ${timestampedEndpoint}: ${response.status}`);
    
    // Cek apakah endpoint adalah publik (misalnya settings/qris-public)
    const isPublicEndpoint = endpoint.includes('/public') || endpoint.includes('qris-settings');
    
    // Cek apakah langganan kedaluwarsa
    if (response.status === 403) {
      const data = await response.json();
      if (data.subscriptionRequired) {
        console.warn('Subscription expired');
        // Tampilkan pesan atau arahkan ke halaman langganan
        return { error: 'subscription_expired', message: data.message };
      }
    }
    
    // Cek apakah token tidak valid
    if (response.status === 401 && !isPublicEndpoint) {
      console.warn(`Token invalid for ${timestampedEndpoint}, attempting refresh`);
      
      // Coba refresh token
      const refreshed = await refreshAuthToken();
      if (refreshed) {
        console.log(`Token refreshed successfully, retrying request to ${timestampedEndpoint}`);
        // Coba lagi dengan token baru
        return fetchWithAuth(endpoint, options);
      } else {
        console.warn('Token refresh failed');
        
        // Jangan redirect jika sedang di halaman login atau public endpoint
        if (!window.location.pathname.includes('/login') && !isPublicEndpoint) {
          // Logout jika refresh gagal
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          sessionStorage.removeItem('refreshToken');
          
          console.log('Auth failed, redirecting to login');
          window.location.href = '/login';
        }
        
        return { error: 'auth_failed', message: 'Sesi Anda telah berakhir' };
      }
    }
    
    // Untuk endpoint public, jangan mencoba refresh token
    if (response.status === 401 && isPublicEndpoint) {
      console.log(`Public endpoint ${endpoint} returned 401, continuing without refresh`);
      
      // Return empty data for QRIS settings to allow fallback
      if (endpoint.includes('qris-settings') || endpoint.includes('qris-public')) {
        return { 
          error: 'auth_failed',
          message: 'QRIS settings require authentication',
          useDefault: true
        };
      }
    }
    
    // Parse response
    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.warn(`Error parsing JSON from ${timestampedEndpoint}:`, e);
      data = { success: response.ok };
    }
    
    if (!response.ok) {
      return { 
        error: data.error || 'unknown_error', 
        message: data.message || 'Terjadi kesalahan', 
        status: response.status 
      };
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching ${timestampedUrl}:`, error);
    
    if (error.name === 'AbortError') {
      return { error: 'timeout', message: 'Permintaan melebihi batas waktu' };
    }
    
    return { error: 'network_error', message: 'Gagal terhubung ke server' };
  } finally {
    clearTimeout(timeoutId);
  }
};

// Fungsi untuk refresh token yang ditingkatkan
export const refreshAuthToken = async () => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    console.warn('No refresh token available');
    return false;
  }
  
  try {
    const backendUrl = getActiveBackendUrl();
    console.log(`Attempting to refresh token at ${backendUrl}/api/user/refresh`);
    
    // Tambahkan timestamp untuk menghindari cache
    const timestamp = Date.now();
    const url = `${backendUrl}/api/user/refresh?_ts=${timestamp}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
      body: JSON.stringify({ token: refreshToken })
    });
    
    if (!response.ok) {
      console.warn(`Token refresh failed with status ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    
    if (data.token) {
      console.log('New token received, saving token');
      
      // Simpan token baru
      if (localStorage.getItem('remember') === 'true') {
        localStorage.setItem('token', data.token);
      } else {
        sessionStorage.setItem('token', data.token);
      }
      
      return true;
    }
    
    console.warn('Token refresh response did not contain token');
    return false;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
};

// Fungsi untuk mencari pesanan dari backend spesifik user
export const findOrders = async (orderData) => {
  const backendUrl = getActiveBackendUrl();
  console.log(`Mencari pesanan di: ${backendUrl}/api/orders/find`);
  
  return fetchWithAuth('/api/orders/find', {
    method: 'POST',
    body: JSON.stringify(orderData)
  });
};

// Memperbarui URL backend untuk user
export const updateBackendUrl = async (newUrl) => {
  // Validasi format URL
  if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
    return { 
      success: false, 
      error: 'invalid_url', 
      message: 'URL harus dimulai dengan http:// atau https://' 
    };
  }
  
  try {
    // Simpan URL baru di localStorage
    localStorage.setItem('backendUrl', newUrl);
    
    // Jika user sudah login, perbarui juga di profil user
    const token = getAuthToken();
    if (token) {
      const response = await fetchWithAuth('/api/user/backend-url', {
        method: 'PUT',
        body: JSON.stringify({ backend_url: newUrl })
      });
      
      if (response.error) {
        return { 
          success: false, 
          error: response.error, 
          message: response.message 
        };
      }
      
      // Perbarui data user di storage
      try {
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          userData.backend_url = newUrl;
          
          if (localStorage.getItem('remember') === 'true') {
            localStorage.setItem('user', JSON.stringify(userData));
          } else {
            sessionStorage.setItem('user', JSON.stringify(userData));
          }
        }
      } catch (e) {
        console.error('Error updating user data:', e);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating backend URL:', error);
    return { 
      success: false, 
      error: 'update_failed', 
      message: 'Gagal memperbarui URL backend' 
    };
  }
};

// Fungsi untuk menguji koneksi ke backend
export const testBackendConnection = async (url) => {
  const testUrl = url || getActiveBackendUrl();
  
  try {
    // Tambahkan timestamp untuk menghindari cache
    const timestamp = Date.now();
    const testUrlWithTimestamp = `${testUrl}/api/test?_ts=${timestamp}`;
    
    const response = await fetch(testUrlWithTimestamp, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
      timeout: 10000
    });
    
    if (!response.ok) {
      return { 
        success: false, 
        error: 'connection_failed', 
        message: `Koneksi gagal dengan status: ${response.status}` 
      };
    }
    
    const data = await response.json();
    
    if (data && data.message === "API is working") {
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
      error: 'connection_error',
      message: `Koneksi gagal: ${error.message}`
    };
  }
};

// Helper untuk menangani endpoint QRIS khusus
export const fetchQrisSettings = async () => {
  try {
    console.log('Fetching QRIS settings');
    
    // Coba beberapa endpoint berbeda secara berurutan
    const endpoints = [
      '/api/settings/qris-public',
      '/api/qris-settings/public',
      '/api/qris-settings?admin=true',
      '/api/admin/qris-settings?admin=true'
    ];
    
    let settings = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying to fetch QRIS settings from: ${endpoint}`);
        const response = await fetchWithAuth(endpoint);
        
        if (response && !response.error) {
          settings = response;
          console.log(`Successfully fetched QRIS settings from ${endpoint}`);
          break;
        }
      } catch (err) {
        console.warn(`Failed to fetch QRIS settings from ${endpoint}:`, err);
      }
    }
    
    if (settings) {
      return { success: true, data: settings };
    } else {
      console.warn('All QRIS settings endpoints failed, using fallback data');
      
      // Gunakan data fallback
      return { 
        success: false, 
        data: {
          merchant_name: "Kinterstore",
          qris_image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAFAAQMAAAD3XjfpAAAABlBMVEX///8AAABVwtN+AAABA0lEQVRo3u2YMQ7DIAxFDRk5Qo7AUTgaR+loOQJHYKSImVTNH8fUVSvBwJs88Gfwl2MwEHweHEIoiqIoiqIoitqkL+p5tgAC+Cx4GGNc/kdc5QcRgA/CgwhAACCAAAIIIIB/CwaRAJ8QLwq+QwgggADuBS8KAQQQQDAF9ABmtbqzn6DUa3Yy8ipdV6t76aYN26xFR76yKTbecw5xg7XT0PTLna5YeVGrZqDT/mllTfG6Wdr9KE+5c5p+0xt0w7afMOvQPFQHbqiPmJqTjnGnJmK4epEQ74KDOPNeCnXngJ2KAu4XAL5fWGIbk8jm1+sA4D+CeywAAAQQQAABBBBAAKdlDkO5qQMRbkZBAAAAAElFTkSuQmCC",
          is_active: true,
          expiry_hours: 24,
          instructions: "Scan kode QR menggunakan aplikasi e-wallet atau mobile banking Anda."
        },
        message: "Menggunakan data QRIS default karena gagal mengambil dari server"
      };
    }
  } catch (error) {
    console.error('Error fetching QRIS settings:', error);
    return { 
      success: false, 
      data: {
        merchant_name: "Kinterstore",
        qris_image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAFAAQMAAAD3XjfpAAAABlBMVEX///8AAABVwtN+AAABA0lEQVRo3u2YMQ7DIAxFDRk5Qo7AUTgaR+loOQJHYKSImVTNH8fUVSvBwJs88Gfwl2MwEHweHEIoiqIoiqIoitqkL+p5tgAC+Cx4GGNc/kdc5QcRgA/CgwhAACCAAAIIIIB/CwaRAJ8QLwq+QwgggADuBS8KAQQQQDAF9ABmtbqzn6DUa3Yy8ipdV6t76aYN26xFR76yKTbecw5xg7XT0PTLna5YeVGrZqDT/mllTfG6Wdr9KE+5c5p+0xt0w7afMOvQPFQHbqiPmJqTjnGnJmK4epEQ74KDOPNeCnXngJ2KAu4XAL5fWGIbk8jm1+sA4D+CeywAAAQQQAABBBBAAKdlDkO5qQMRbkZBAAAAAElFTkSuQmCC",
        is_active: true,
        expiry_hours: 24,
        instructions: "Scan kode QR menggunakan aplikasi e-wallet atau mobile banking Anda."
      },
      message: "Terjadi kesalahan saat mengambil pengaturan QRIS"
    };
  }
};