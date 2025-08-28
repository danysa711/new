// File: src/services/api.js

import axios from 'axios';
import { 
  getBackendUrlForEndpoint, 
  getAuthHeaders, 
  axiosConfig,
  MAIN_BACKEND_URL
} from './api-config';

// Buat instance axios dengan konfigurasi dasar
const apiInstance = axios.create({
  ...axiosConfig
});

// Interceptor untuk set dynamic baseURL dan token
apiInstance.interceptors.request.use(
  (config) => {
    // Tentukan baseURL berdasarkan endpoint
    const endpoint = config.url || '';
    config.baseURL = getBackendUrlForEndpoint(endpoint);
    
    // Tambahkan headers autentikasi
    const authHeaders = getAuthHeaders();
    config.headers = {
      ...config.headers,
      ...authHeaders
    };
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Fungsi untuk melakukan request ke API
export const apiRequest = async (method, endpoint, data = null, options = {}) => {
  try {
    const config = {
      method,
      url: endpoint,
      ...options
    };
    
    if (data && ['post', 'put', 'patch'].includes(method.toLowerCase())) {
      config.data = data;
    } else if (data) {
      config.params = data;
    }
    
    const response = await apiInstance(config);
    return response.data;
  } catch (error) {
    console.error(`API Error (${method} ${endpoint}):`, error);
    throw error;
  }
};

// Export fungsi dan konstanta
export { MAIN_BACKEND_URL };
export default apiInstance;