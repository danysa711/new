const jwt = require("jsonwebtoken");
const { User, Subscription, db } = require("../models");

const authenticateUser = async (req, res, next) => {
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
    
    // Tambahkan tenant info jika ada
    if (decoded.tenant_slug) {
      req.tenantSlug = decoded.tenant_slug;
      req.tenantId = decoded.tenant_id;
    }

    // Tambahkan pengecekan apakah user masih ada di database
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

    // Jika ada tenant, periksa apakah tenant masih aktif
    if (decoded.tenant_slug) {
      const tenant = await User.findOne({
        where: { url_slug: decoded.tenant_slug }
      });

      if (!tenant) {
        return res.status(404).json({ 
          error: "Tenant tidak ditemukan", 
          code: "TENANT_NOT_FOUND" 
        });
      }

      const tenantSubscription = await Subscription.findOne({
        where: {
          user_id: tenant.id,
          status: "active",
          end_date: {
            [db.Sequelize.Op.gt]: new Date()
          }
        }
      });

      if (!tenantSubscription) {
        return res.status(403).json({ 
          error: "Tenant tidak aktif", 
          code: "INACTIVE_TENANT",
          subscriptionRequired: true
        });
      }
    }

    // Jika URL berisi slug, cek apakah user bisa mengakses
    const urlPath = req.originalUrl;
    if (urlPath.includes('/user/page/')) {
      const urlSlug = urlPath.split('/user/page/')[1]?.split('/')[0];
      
      // Jika tidak sama dengan user slug dan bukan admin, tolak akses
      if (urlSlug !== req.userSlug && req.userRole !== 'admin') {
        return res.status(403).json({ error: "Tidak memiliki akses ke halaman ini" });
      }
    }

    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(403).json({ error: "Token tidak valid" });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.userRole !== "admin") {
    return res.status(403).json({ error: "Akses ditolak, memerlukan hak admin" });
  }
  next();
};

const requireActiveSubscription = async (req, res, next) => {
  // Admin tidak memerlukan langganan aktif
  if (req.userRole === "admin") {
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
        // Mengirim status 403 dengan flag khusus untuk menandai langganan kedaluwarsa
        // Middleware akan memblokir akses ke API, tetapi di frontend pengguna tetap dapat
        // melihat halaman user mereka, hanya saja koneksi API yang terputus
        return res.status(403).json({ 
          error: "Langganan tidak aktif", 
          subscriptionRequired: true,
          message: "Koneksi ke API dinonaktifkan karena langganan Anda telah berakhir. Silakan perbarui langganan Anda."
        });
      }
    }

    next();
  } catch (error) {
    console.error("Error checking subscription:", error);
    return res.status(500).json({ error: "Terjadi kesalahan saat memeriksa langganan" });
  }
};

module.exports = { authenticateUser, requireAdmin, requireActiveSubscription };