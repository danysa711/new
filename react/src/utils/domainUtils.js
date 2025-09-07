// File: src/utils/domainUtils.js

/**
 * Mendeteksi domain saat ini dan menghasilkan URL backend yang sesuai
 * @returns {string} URL backend berdasarkan domain saat ini
 */
export const detectDomainAndGenerateBackendUrl = () => {
  const currentDomain = window.location.hostname;
  
  // Jika domain adalah kinterstore.my.id atau subdomain-nya, gunakan db.kinterstore.my.id
  if (currentDomain.includes('kinterstore.my.id')) {
    return 'https://db.kinterstore.my.id';
  }
  
  // Jika domain adalah kinterstore.com atau subdomain-nya, gunakan db.kinterstore.com
  if (currentDomain.includes('kinterstore.com')) {
    return 'https://db.kinterstore.com';
  }
  
  // Jika localhost atau environment development
  if (currentDomain === 'localhost' || currentDomain === '127.0.0.1') {
    return import.meta.env.VITE_BACKEND_URL || 'https://db.kinterstore.my.id';
  }
  
  // Default untuk domain lain yang tidak dikenali
  return 'https://db.kinterstore.my.id';
};

/**
 * Mendapatkan API URL berdasarkan backend URL
 * @param {string} backendUrl - URL backend yang digunakan
 * @returns {string} API URL lengkap dengan endpoint
 */
export const getApiUrl = (backendUrl, endpoint = '/api') => {
  if (!backendUrl) {
    backendUrl = detectDomainAndGenerateBackendUrl();
  }
  
  // Pastikan backendUrl tidak berakhir dengan '/' dan endpoint dimulai dengan '/'
  if (backendUrl.endsWith('/')) {
    backendUrl = backendUrl.slice(0, -1);
  }
  
  if (!endpoint.startsWith('/')) {
    endpoint = '/' + endpoint;
  }
  
  return `${backendUrl}${endpoint}`;
};

/**
 * Mendapatkan frontend URL berdasarkan domain saat ini
 * @returns {string} URL frontend
 */
export const getFrontendUrl = () => {
  const currentDomain = window.location.hostname;
  const protocol = window.location.protocol;
  
  // Jika domain adalah kinterstore.my.id atau subdomain-nya, gunakan kinterstore.my.id
  if (currentDomain.includes('kinterstore.my.id')) {
    if (currentDomain === 'db.kinterstore.my.id' || currentDomain === 'www.kinterstore.my.id') {
      return 'https://kinterstore.my.id';
    }
    return `${protocol}//${currentDomain}`;
  }
  
  // Jika domain adalah kinterstore.com atau subdomain-nya, gunakan kinterstore.com
  if (currentDomain.includes('kinterstore.com')) {
    if (currentDomain === 'db.kinterstore.com' || currentDomain === 'www.kinterstore.com') {
      return 'https://kinterstore.com';
    }
    return `${protocol}//${currentDomain}`;
  }
  
  // Untuk localhost atau development
  if (currentDomain === 'localhost' || currentDomain === '127.0.0.1') {
    return `${protocol}//${currentDomain}:${window.location.port}`;
  }
  
  // Default
  return `${protocol}//${currentDomain}`;
};