// File: express/middlewares/userDataFilter.js

/**
 * Middleware untuk memastikan bahwa query database selalu memfilter berdasarkan user_id 
 * dari user yang login, kecuali untuk admin yang dapat mengakses semua data
 */
const userDataFilter = (req, res, next) => {
  // Skip untuk admin, mereka dapat melihat semua data
  if (req.userRole === "admin") {
    return next();
  }

  // Untuk user biasa, tambahkan filter user_id ke query
  // Jika req.query tidak ada, inisialisasi
  if (!req.query) {
    req.query = {};
  }

  // Tambahkan user_id ke query
  req.query.user_id = req.userId;

  // Jika ada body request (untuk operasi POST/PUT), tambahkan user_id ke body
  if (req.body && typeof req.body === 'object') {
    // Jangan override jika sudah ada user_id yang dikirim dan user adalah admin
    if (!req.body.user_id) {
      req.body.user_id = req.userId;
    }
  }

  next();
};

module.exports = userDataFilter;