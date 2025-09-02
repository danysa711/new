// services/authService.js
/**
 * Memeriksa apakah user telah terautentikasi sebelum mengakses fitur QRIS
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return !!token;
};

/**
 * Memeriksa apakah user memiliki akses admin
 * @returns {boolean}
 */
export const isAdmin = () => {
  try {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!userStr) return false;
    
    const userData = JSON.parse(userStr);
    return userData.role === 'admin';
  } catch (e) {
    console.error('Error checking admin status:', e);
    return false;
  }
};