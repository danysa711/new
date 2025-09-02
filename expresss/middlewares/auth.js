// Perbaikan untuk express/middlewares/auth.js

const jwt = require("jsonwebtoken");
const { User, Subscription, db } = require("../models");

const authenticateUser = async (req, res, next) => {
  // PENTING: Tidak memerlukan autentikasi untuk endpoint login dan register
  if (req.originalUrl === '/api/login' || req.originalUrl === '/api/register') {
    console.log("Allowing access to authentication endpoint without token");
    return next();
  }

  const token = req.header("Authorization")?.split(" ")[1]; // Ambil token dari header

  if (!token) {
    return res.status(401).json({ error: "Akses ditolak, token tidak ditemukan" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "mysecretkey");
    req.userId = decoded.id;
    req.userRole = decoded.role || "user";
    req.userSlug = decoded.url_slug;
    req.hasActiveSubscription = decoded.hasActiveSubscription;

    // Tambahkan debug log
    console.log("Token decoded successfully:", { 
      userId: req.userId, 
      userRole: req.userRole,
      hasActiveSubscription: req.hasActiveSubscription,
      path: req.originalUrl
    });

    // Skip untuk user admin yang hardcoded
    if (decoded.id !== "admin") {
      const user = await User.findByPk(decoded.id);
      if (!user) {
        return res.status(401).json({ 
          error: "User tidak ditemukan", 
          code: "USER_DELETED" // Kode khusus untuk menandai user telah dihapus
        });
      }
    }
    

    // Jika endpoint adalah /api/orders/find, pastikan pengguna memiliki langganan aktif
    if (req.originalUrl === '/api/orders/find' && req.userRole !== "admin") {
      try {
        const activeSubscription = await Subscription.findOne({
          where: {
            user_id: req.userId,
            status: "active",
            end_date: {
              [db.Sequelize.Op.gt]: new Date()
            }
          }
        });
        
        if (!activeSubscription) {
          console.log("User tidak memiliki langganan aktif, akses ditolak:", req.userId);
          return res.status(403).json({ 
            message: "Anda memerlukan langganan aktif untuk menggunakan fitur ini",
            requireSubscription: true,
            noAccess: true
          });
        }
        
        // Lanjutkan jika langganan aktif
        console.log("User memiliki langganan aktif, akses diberikan:", req.userId);
      } catch (error) {
        console.error("Error saat memeriksa langganan:", error);
        return res.status(500).json({ error: "Terjadi kesalahan saat memeriksa langganan" });
      }
    }

    // Langsung next() jika user adalah admin
    if (req.userRole === "admin" || req.userId === "admin") {
      return next();
    }

    // Jika URL berisi slug, cek apakah user bisa mengakses
    const urlPath = req.originalUrl;
    if (urlPath.includes('/user/page/')) {
      // Kode untuk pengecekan slug...
    }

    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(403).json({ error: "Token tidak valid" });
  }
};

const requireAdmin = (req, res, next) => {
  // Tambahkan debug log
  console.log("Checking admin rights:", { 
    userRole: req.userRole, 
    userId: req.userId,
    path: req.originalUrl,
    query: req.query,
    headers: req.headers
  });

  // Khusus untuk user hardcoded "admin" atau user dengan role "admin"
  if (req.userId === "admin" || req.userRole === "admin") {
    console.log("Admin access granted");
    return next();
  }
  
  console.log("Admin access denied");
  return res.status(403).json({ error: "Akses ditolak, memerlukan hak admin" });
};

const requireActiveSubscription = async (req, res, next) => {
  // Admin tidak memerlukan langganan aktif
  if (req.userRole === "admin" || req.userId === "admin") {
    return next();
  }
  
 // Untuk /api/orders/find - berikan warning tapi tetap lanjutkan ke controller
    // yang akan memeriksa langganan dan memberikan respons yang sesuai
    if (req.originalUrl === '/api/orders/find') {
      console.log("Warning: Bypass subscription check for /api/orders/find - controller harus memeriksa");
      req.bypassedSubscriptionCheck = true; // Tambahkan flag untuk controller
      return next();
    }

  try {
    // Periksa apakah user memiliki langganan aktif
    const hasActiveSubscription = req.hasActiveSubscription;
    
    if (!hasActiveSubscription) {
      // Double-check dengan database
      const activeSubscription = await Subscription.findOne({
        where: {
          user_id: req.userId,
          status: "active",
          end_date: {
            [db.Sequelize.Op.gt]: new Date()
          }
        }
      });

      if (!activeSubscription) {
        console.log("User tidak memiliki langganan aktif:", req.userId);
        // Jika ini adalah permintaan GET untuk data, tolak permintaan
        if (req.method === 'GET' && 
            (req.originalUrl.includes('/api/software') || 
             req.originalUrl.includes('/api/software-versions') || 
             req.originalUrl.includes('/api/licenses'))) {
          // Mengirim status 403 dengan flag khusus untuk menandai langganan kedaluwarsa
          return res.status(403).json({ 
            error: "Langganan tidak aktif", 
            subscriptionRequired: true,
            message: "Akses ke data dinonaktifkan karena Anda tidak memiliki langganan aktif. Silakan aktifkan langganan Anda."
          });
        } else if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
          // Menolak semua operasi modifikasi data jika tidak berlangganan
          return res.status(403).json({ 
            error: "Langganan tidak aktif", 
            subscriptionRequired: true,
            message: "Operasi penulisan dan modifikasi data dinonaktifkan karena Anda tidak memiliki langganan aktif. Silakan aktifkan langganan Anda."
          });
        }
      }
    }

    next();
  } catch (error) {
    console.error("Error checking subscription:", error);
    return res.status(500).json({ error: "Terjadi kesalahan saat memeriksa langganan" });
  }
};

module.exports = { authenticateUser, requireAdmin, requireActiveSubscription };