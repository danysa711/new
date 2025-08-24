const jwt = require("jsonwebtoken");
const { User, Subscription, db } = require("../models");

const authenticateUser = async (req, res, next) => {
  // Log semua request untuk debugging
  console.log(`[AUTH] ${req.method} ${req.path}`);

  const token = req.header("Authorization")?.split(" ")[1]; // Ambil token dari header

  if (!token) {
    console.log(`[AUTH] Token tidak ditemukan: ${req.path}`);
    return res.status(401).json({ error: "Akses ditolak, token tidak ditemukan" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "mysecretkey");
    req.userId = decoded.id;
    req.userRole = decoded.role || "user";
    req.userSlug = decoded.url_slug;
    
    console.log(`[AUTH] User ID: ${req.userId}, Role: ${req.userRole}, Path: ${req.path}`);
    
    // Pengecualian untuk rute tertentu yang harus diizinkan tanpa pengecekan tambahan
    const criticalEndpoints = [
      '/api/settings',
      '/api/subscriptions/user',
      '/api/user/profile',
      '/api/test'
    ];
    
    // Jika ini adalah endpoint penting, izinkan akses langsung
    if (criticalEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
      console.log(`[AUTH] Critical endpoint allowed: ${req.path}`);
      return next();
    }
    
    // Pastikan kita memiliki status langganan terbaru dalam request
    // Untuk admin, selalu berikan akses penuh
    if (decoded.id === "admin" || decoded.role === "admin") {
      req.hasActiveSubscription = true;
      return next();
    }

    // Pengecekan apakah user masih ada di database
    const user = await User.findByPk(decoded.id);
    if (!user) {
      console.log(`[AUTH] User tidak ditemukan: ${req.userId}`);
      return res.status(401).json({ 
        error: "User tidak ditemukan", 
        code: "USER_DELETED"
      });
    }

    // Dapatkan status langganan terbaru dari database
    const activeSubscription = await Subscription.findOne({
      where: {
        user_id: decoded.id,
        status: "active",
        end_date: {
          [db.Sequelize.Op.gt]: new Date()
        }
      }
    });
    
    // Set status langganan saat ini
    req.hasActiveSubscription = !!activeSubscription;
    console.log(`[AUTH] Has active subscription: ${req.hasActiveSubscription}`);

    // Jika URL berisi slug, cek apakah user bisa mengakses
    const urlPath = req.originalUrl;
    if (urlPath.includes('/user/page/')) {
      const urlSlug = urlPath.split('/user/page/')[1]?.split('/')[0];
      
      // Jika tidak sama dengan user slug dan bukan admin, tolak akses
      if (urlSlug !== req.userSlug && req.userRole !== 'admin') {
        console.log(`[AUTH] Slug mismatch: ${urlSlug} !== ${req.userSlug}`);
        return res.status(403).json({ error: "Tidak memiliki akses ke halaman ini" });
      }
    }

    next();
  } catch (error) {
    console.error(`[AUTH] Error: ${error.message}`);
    return res.status(403).json({ error: "Token tidak valid" });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.userRole !== "admin") {
    console.log(`[AUTH] Admin required, but user is ${req.userRole}`);
    return res.status(403).json({ error: "Akses ditolak, memerlukan hak admin" });
  }
  next();
};

const requireActiveSubscription = async (req, res, next) => {
  // Log semua request untuk debugging
  console.log(`[SUBSCRIPTION] ${req.method} ${req.path}`);
  
  // Admin tidak memerlukan langganan aktif
  if (req.userRole === "admin") {
    console.log(`[SUBSCRIPTION] Admin bypass: ${req.path}`);
    return next();
  }

  // Pengecualian untuk endpoint tertentu yang harus dapat diakses bahkan tanpa langganan aktif
  const exceptedEndpoints = [
    '/api/settings',
    '/api/subscriptions/user',
    '/api/user/profile',
    '/api/test',
    '/api/public'
  ];
  
  // Endpoint penting yang harus diizinkan tanpa langganan aktif
  for (const endpoint of exceptedEndpoints) {
    if (req.path.startsWith(endpoint)) {
      console.log(`[SUBSCRIPTION] Excepted endpoint allowed: ${req.path}`);
      return next();
    }
  }

  // Cek langganan aktif langsung dari request object yang sudah diset di authenticateUser
  try {
    // Query ulang database untuk memastikan data terbaru
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
      console.log(`[SUBSCRIPTION] No active subscription for user ${req.userId} at ${req.path}`);
      return res.status(403).json({ 
        error: "Langganan tidak aktif", 
        subscriptionRequired: true,
        message: "Koneksi ke API dinonaktifkan karena langganan Anda telah berakhir. Silakan perbarui langganan Anda."
      });
    }
    
    console.log(`[SUBSCRIPTION] Active subscription verified for ${req.path}`);
    next();
  } catch (error) {
    console.error(`[SUBSCRIPTION] Error checking subscription: ${error.message}`);
    // Dalam kasus error, lebih baik izinkan akses daripada memblokir
    return next();
  }
};

module.exports = { authenticateUser, requireAdmin, requireActiveSubscription };