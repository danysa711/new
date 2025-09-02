// middlewares/subscription.js
const { User, Subscription, db } = require("../models");

/**
 * Middleware untuk memeriksa apakah pengguna memiliki langganan aktif
 * Gunakan setelah authenticateUser untuk memastikan req.userId sudah terisi
 */
const requireActiveSubscription = async (req, res, next) => {
  try {
    // Admin selalu diizinkan mengakses
    if (req.userRole === "admin") {
      return next();
    }

    // Dapatkan ID pengguna dari token JWT
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ 
        error: "Akses ditolak", 
        message: "Anda harus login terlebih dahulu" 
      });
    }

    // Cek apakah pengguna memiliki langganan aktif
    const activeSubscription = await Subscription.findOne({
      where: {
        user_id: userId,
        status: "active",
        end_date: {
          [db.Sequelize.Op.gt]: new Date()
        }
      }
    });

    if (!activeSubscription) {
      return res.status(403).json({ 
        error: "Akses ditolak", 
        message: "Anda memerlukan langganan aktif untuk mengakses fitur ini",
        requireSubscription: true 
      });
    }

    // Tambahkan informasi langganan ke request untuk digunakan di controller
    req.hasActiveSubscription = true;
    req.subscription = activeSubscription;

    next();
  } catch (error) {
    console.error("Error memeriksa langganan:", error);
    return res.status(500).json({ 
      error: "Terjadi kesalahan pada server", 
      message: "Gagal memeriksa status langganan" 
    });
  }
};

module.exports = { requireActiveSubscription };