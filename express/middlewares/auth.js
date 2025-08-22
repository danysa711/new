// express/middlewares/auth.js
const jwt = require("jsonwebtoken");
const { User } = require("../models");

const authenticateUser = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1]; // Ambil token dari header

  if (!token) {
    return res.status(401).json({ error: "Akses ditolak, token tidak ditemukan" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role; // Add role to request
    next();
  } catch (error) {
    return res.status(403).json({ error: "Token tidak valid" });
  }
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.userRole !== "admin") {
    return res.status(403).json({ error: "Akses ditolak, hanya admin yang diizinkan" });
  }
  next();
};

// Middleware to check if URL is active for this user
const checkActiveUrl = async (req, res, next) => {
  try {
    const userId = req.userId;
    const user = await User.findByPk(userId);
    
    if (!user || !user.url_active) {
      return res.status(403).json({ 
        error: "URL tidak aktif, silakan aktifkan langganan Anda",
        subscription_required: true
      });
    }
    
    next();
  } catch (error) {
    console.error("Error checking active URL:", error);
    return res.status(500).json({ error: "Terjadi kesalahan saat memeriksa status URL" });
  }
};

module.exports = { authenticateUser, isAdmin, checkActiveUrl };