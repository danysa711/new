const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { db, User, Subscription, Software, SoftwareVersion, License, Order } = require("./models");

// Inisialisasi Express
const app = express();
const PORT = process.env.PORT || 3500;

// Definisikan CORS options dengan semua domain yang diizinkan
const corsOptions = {
  origin: [
    "*", // Izinkan semua origins
    "https://kinterstore.my.id",
    "https://www.kinterstore.my.id", 
    "https://db.kinterstore.my.id",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware untuk logging permintaan
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Request origin:', req.headers.origin);
  next();
});

// Middleware untuk autentikasi token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: "Akses ditolak, token tidak ditemukan" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "mysecretkey");
    req.userId = decoded.id;
    req.userRole = decoded.role || "user";
    req.userSlug = decoded.url_slug;
    req.hasActiveSubscription = decoded.hasActiveSubscription;
    
    // Debug log
    console.log(`Authenticated user: ${req.userId} (${req.userRole})`);
    
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(403).json({ error: "Token tidak valid" });
  }
};

// Middleware untuk memeriksa apakah user adalah admin
const requireAdmin = (req, res, next) => {
  if (req.userRole !== "admin" && req.userId !== "admin") {
    return res.status(403).json({ error: "Akses ditolak, memerlukan hak admin" });
  }
  
  next();
};

// Endpoint untuk testing
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working", timestamp: new Date().toISOString() });
});

// ===================== USER AUTHENTICATION =====================

// Login endpoint
app.post("/api/login", async (req, res) => {
  try {
    console.log("Login request received:", req.body);
    const { username, password } = req.body;

    // Validasi input kosong
    if (!username || !password) {
      return res.status(400).json({ error: "Username dan password harus diisi" });
    }

    // Special admin login
    if (username === "admin" && password === "Admin123!") {
      console.log("Admin login successful");
      const token = jwt.sign(
        { id: "admin", username: "admin", role: "admin", url_slug: "admin" }, 
        process.env.JWT_SECRET || "mysecretkey", 
        { expiresIn: "3d" }
      );
      
      const refreshToken = jwt.sign(
        { id: "admin" }, 
        process.env.REFRESH_SECRET || "mysecretkey", 
        { expiresIn: "7d" }
      );

      console.log("Admin token generated");
      return res.status(200).json({ 
        token, 
        refreshToken,
        user: {
          id: "admin",
          username: "admin",
          email: "admin@example.com",
          role: "admin",
          url_slug: "admin",
          hasActiveSubscription: true
        }
      });
    } 

    // Regular user login
    console.log("Searching for user:", username);
    const user = await User.findOne({
      where: {
        [db.Sequelize.Op.or]: [
          { username: username },
          { email: username }
        ]
      }
    });

    console.log("User found:", user ? "Yes" : "No");

    // Jika user tidak ditemukan
    if (!user) {
      return res.status(401).json({ error: "Username atau password salah" });
    }

    // Cek password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match:", isMatch);

    if (!isMatch) {
      return res.status(401).json({ error: "Username atau password salah" });
    }

    // Periksa apakah user memiliki langganan aktif
    const activeSubscription = await Subscription.findOne({
      where: {
        user_id: user.id,
        status: "active",
        end_date: {
          [db.Sequelize.Op.gt]: new Date()
        }
      }
    });

    console.log("Has active subscription:", activeSubscription ? "Yes" : "No");

    // Generate Access Token (expire 3 hari)
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role, 
        url_slug: user.url_slug,
        hasActiveSubscription: !!activeSubscription
      },
      process.env.JWT_SECRET || "mysecretkey",
      { expiresIn: "3d" }
    );

    // Generate Refresh Token (expire 7 hari)
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.REFRESH_SECRET || "mysecretkey",
      { expiresIn: "7d" }
    );

    console.log("Login successful, sending response");
    return res.status(200).json({ 
      token, 
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        url_slug: user.url_slug,
        backend_url: user.backend_url || process.env.BACKEND_URL || "https://db.kinterstore.my.id",
        hasActiveSubscription: !!activeSubscription
      }
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: "Terjadi kesalahan, coba lagi nanti" });
  }
});

// Register endpoint
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validasi input kosong
    if (!username || !password || !email) {
      return res.status(400).json({ error: "Username, email, dan password harus diisi" });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({ error: "Username sudah digunakan" });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ error: "Email sudah digunakan" });
    }

    // Validasi panjang password
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ error: "Password harus minimal 8 karakter dan mengandung huruf serta angka" });
    }

    // Generate unique URL slug
    const generateUniqueSlug = async (username) => {
      const baseSlug = username.toLowerCase().replace(/[^a-z0-9]/g, "");
      const randomString = require("crypto").randomBytes(4).toString("hex");
      const slug = `${baseSlug}-${randomString}`;
      
      // Check if slug exists
      const existingUser = await User.findOne({ where: { url_slug: slug } });
      if (existingUser) {
        // If exists, try again with a different random string
        return generateUniqueSlug(username);
      }
      
      return slug;
    };
    
    const url_slug = await generateUniqueSlug(username);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Set default role to user
    const role = "user";

    // Simpan user
    const user = await User.create({ 
      username, 
      email, 
      password: hashedPassword, 
      role,
      url_slug,
      backend_url: process.env.BACKEND_URL || "https://db.kinterstore.my.id"
    });

    // Generate tokens
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, url_slug: user.url_slug },
      process.env.JWT_SECRET || "mysecretkey",
      { expiresIn: "3d" }
    );
    
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.REFRESH_SECRET || "mysecretkey",
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        url_slug: user.url_slug,
        backend_url: user.backend_url
      },
      token,
      refreshToken
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(400).json({ error: error.message || "Terjadi kesalahan" });
  }
});

// Refresh token endpoint
app.post("/api/user/refresh", async (req, res) => {
  const { token } = req.body;

  if (!token) return res.status(401).json({ error: "Refresh Token diperlukan!" });

  try {
    // Verifikasi Refresh Token
    const decoded = jwt.verify(token, process.env.REFRESH_SECRET || "mysecretkey");

    if (decoded.id === "admin") {
      const newAccessToken = jwt.sign(
        { id: decoded.id, role: "admin" }, 
        process.env.JWT_SECRET || "mysecretkey", 
        { expiresIn: "3d" }
      );

      res.json({ token: newAccessToken });
    } else {
      // Cek apakah token masih valid di database
      const user = await User.findByPk(decoded.id);
      if (!user) {
        return res.status(403).json({ error: "Refresh Token tidak valid!" });
      }
      
      // Periksa apakah user memiliki langganan aktif
      const activeSubscription = await Subscription.findOne({
        where: {
          user_id: user.id,
          status: "active",
          end_date: {
            [db.Sequelize.Op.gt]: new Date()
          }
        }
      });

      // Generate Access Token baru (3 hari)
      const newAccessToken = jwt.sign(
        { 
          id: user.id, 
          username: user.username, 
          role: user.role, 
          url_slug: user.url_slug,
          hasActiveSubscription: !!activeSubscription
        },
        process.env.JWT_SECRET || "mysecretkey",
        { expiresIn: "3d" }
      );

      res.json({ token: newAccessToken });
    }
  } catch (error) {
    console.error("Refresh Token error:", error);
    res.status(403).json({ error: "Refresh Token tidak valid!" });
  }
});

// Get user profile endpoint
app.get("/api/user/profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    // Handling untuk admin khusus
    if (userId === "admin") {
      return res.json({
        user: {
          id: "admin",
          username: "admin",
          email: "admin@example.com",
          role: "admin",
          url_slug: "admin",
          backend_url: process.env.BACKEND_URL || "https://db.kinterstore.my.id",
          createdAt: new Date(),
          hasActiveSubscription: true
        }
      });
    }

    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'email', 'role', 'url_slug', 'backend_url', 'createdAt'],
      include: [{
        model: Subscription,
        where: {
          status: 'active',
          end_date: {
            [db.Sequelize.Op.gt]: new Date()
          }
        },
        required: false
      }]
    });

    if (!user) {
      return res.status(404).json({ 
        error: "User tidak ditemukan", 
        code: "USER_DELETED"  // Kode khusus untuk menandai user telah dihapus
      });
    }

    const hasActiveSubscription = user.Subscriptions && user.Subscriptions.length > 0;

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        url_slug: user.url_slug,
        backend_url: user.backend_url || process.env.BACKEND_URL || "https://db.kinterstore.my.id",
        createdAt: user.createdAt,
        hasActiveSubscription: hasActiveSubscription,
        subscription: hasActiveSubscription ? {
          id: user.Subscriptions[0].id,
          startDate: user.Subscriptions[0].start_date,
          endDate: user.Subscriptions[0].end_date,
          status: user.Subscriptions[0].status,
          paymentStatus: user.Subscriptions[0].payment_status
        } : null
      }
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Terjadi kesalahan, coba lagi nanti" });
  }
});

// Update backend URL endpoint
app.put("/api/user/backend-url", authenticateToken, async (req, res) => {
  try {
    const { backend_url } = req.body;
    const userId = req.userId;

    // Validasi URL
    if (!backend_url || !backend_url.match(/^https?:\/\/.+/)) {
      return res.status(400).json({ error: "URL backend tidak valid. Harus dimulai dengan http:// atau https://" });
    }

    // Admin khusus tidak perlu update
    if (userId === "admin") {
      return res.json({ 
        message: "URL backend berhasil diperbarui", 
        backend_url 
      });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: "User tidak ditemukan" });

    await user.update({ backend_url });

    res.json({ message: "URL backend berhasil diperbarui", backend_url });
  } catch (error) {
    console.error("Error updating backend URL:", error);
    res.status(500).json({ error: "Terjadi kesalahan, coba lagi nanti" });
  }
});

// ===================== DATA ACCESS WITH USER CONTEXT =====================

// Middleware untuk memberikan konteks user ke setiap request data
const withUserContext = (req, res, next) => {
  // Jika user sudah diautentikasi, tambahkan konteks user ke req
  if (req.userId) {
    // Ambil data dari query atau body request
    const query = req.method === 'GET' ? req.query : req.body;
    
    // Jika bukan admin, tambahkan filter untuk user_id
    if (req.userRole !== 'admin') {
      // Tambahkan user_id ke query atau body
      if (req.method === 'GET') {
        req.query.user_id = req.userId;
      } else {
        req.body.user_id = req.userId;
      }
      
      console.log(`Applied user context: user_id=${req.userId} for ${req.method} ${req.url}`);
    }
  }
  
  next();
};

// Endpoint untuk mencari pesanan - special case yang bisa diakses oleh semua user
app.post("/api/orders/find", authenticateToken, async (req, res) => {
  let transaction;
  const userId = req.userId;

  console.log("findOrder diakses oleh:", {
    userId: userId,
    role: req.userRole,
    body: req.body
  });

  try {
    transaction = await db.sequelize.transaction({
      isolationLevel: db.Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    });

    const { order_id, item_name, os, version, item_amount } = req.body;

    const software = await Software.findOne({
      where: db.sequelize.where(db.sequelize.fn("LOWER", db.sequelize.col("name")), { 
        [db.Sequelize.Op.regexp]: item_name.toLowerCase() 
      }),
    });

    if (!software) {
      await transaction.rollback();
      return res.status(404).json({ message: "Software tidak ditemukan" });
    }
    
    // PENTING: Tidak ada pengecekan user_id untuk /api/orders/find
    // Ini memungkinkan semua user untuk mengakses data software
    
    // Cari softwareVersion berdasarkan software_id, os, version
    const softwareVersion = await SoftwareVersion.findOne({
      where: { software_id: software.id, os, version },
      transaction,
    });
    
    // PENTING: Tidak ada pengecekan user_id untuk softwareVersion
    
    let licenses = [];
    let licenseInfo = [];

    // Jika software tidak butuh lisensi dan tidak butuh versi → return download link saja
    if (!software.requires_license) {
      await transaction.commit();
      return res.json({
        message: "Pesanan ditemukan dan diproses",
        item: software.name,
        order_id: null,
        download_link: softwareVersion?.download_link || null,
        licenses: [], // Kosongkan lisensi karena tidak diperlukan
      });
    }

    // Jika software membutuhkan versi tertentu tapi versi tidak ditemukan → return error
    if (software.search_by_version && !softwareVersion) {
      await transaction.commit();
      return res.json({
        message: "Versi software tidak ditemukan",
        item: software.name,
        order_id: null,
        download_link: null,
        licenses: [],
      });
    }

    // Mencari lisensi
    let licenseQuery = { software_id: software.id, is_active: false };

    // PENTING: Tidak ada filter user_id agar semua lisensi dapat diakses
    
    if (software.search_by_version) {
      // Jika software butuh lisensi & butuh versi spesifik, gunakan software_version_id
      licenseQuery.software_version_id = softwareVersion?.id;
    }

    // Cari lisensi yang tersedia
    licenses = await License.findAll({
      where: licenseQuery,
      limit: item_amount,
      lock: true,
      transaction,
    });

    // Jika lisensi tidak cukup, tetapi softwareVersion tersedia dan software membutuhkan lisensi & versi → Kembalikan download link saja
    if (licenses.length < item_amount && software.requires_license && software.search_by_version && softwareVersion?.download_link) {
      await transaction.commit();
      return res.json({
        message: "Lisensi tidak tersedia, tetapi download link diberikan",
        item: software.name,
        order_id: null,
        download_link: softwareVersion.download_link,
        licenses: [],
      });
    }

    if (licenses.length < item_amount) {
      await transaction.rollback();
      return res.status(400).json({ message: "Stok lisensi tidak cukup" });
    }

    // Tandai lisensi sebagai aktif
    await Promise.all(
      licenses.map(async (license) => {
        await license.update(
          { is_active: true, used_at: new Date(), updatedAt: new Date() },
          { transaction }
        );
      })
    );

    licenseInfo = licenses.map((l) => l.license_key);

    // Simpan order dalam database
    const order = await Order.create(
      {
        order_id,
        item_name,
        os,
        version,
        license_count: software.requires_license ? item_amount : 0,
        status: "processed",
        software_id: software.id,
        user_id: userId,
        createdAt: new Date(),
      },
      { transaction }
    );

    await Promise.all(
      licenses.map(async (license) => {
        await db.sequelize.models.OrderLicense.create(
          {
            order_id: order.id,
            license_id: license.id,
          },
          { transaction }
        );
      })
    );

    await transaction.commit();

    return res.json({
      message: "Pesanan ditemukan dan diproses",
      item: software.name,
      order_id: order.order_id,
      download_link: softwareVersion?.download_link || null,
      licenses: licenseInfo,
    });
  } catch (error) {
    console.error("Terjadi kesalahan:", error);
    if (transaction && !transaction.finished) await transaction.rollback();
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
});

// ===================== GENERAL DATA ENDPOINTS WITH USER CONTEXT =====================

// Middleware to apply user context before processing requests
app.use('/api/software*', authenticateToken, withUserContext);
app.use('/api/software-versions*', authenticateToken, withUserContext);
app.use('/api/licenses*', authenticateToken, withUserContext);
app.use('/api/orders*', authenticateToken, withUserContext);

// Software routes
app.get('/api/software', async (req, res) => {
  try {
    const whereCondition = req.userRole === 'admin' ? {} : { user_id: req.userId };
    
    const software = await Software.findAll({
      where: whereCondition
    });
    
    res.status(200).json(software);
  } catch (error) {
    console.error('Error fetching software:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

app.post('/api/software', async (req, res) => {
  try {
    const { name, requires_license, search_by_version } = req.body;
    const userId = req.userId;
    
    const newSoftware = await Software.create({
      name,
      requires_license,
      search_by_version,
      user_id: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    res.status(201).json({ message: 'Software berhasil ditambahkan', software: newSoftware });
  } catch (error) {
    console.error('Error creating software:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Software Version routes
app.get('/api/software-versions', async (req, res) => {
  try {
    const whereCondition = req.userRole === 'admin' ? {} : { user_id: req.userId };
    
    const versions = await SoftwareVersion.findAll({
      where: whereCondition,
      include: [{ model: Software, attributes: ["name"] }]
    });
    
    res.status(200).json(versions);
  } catch (error) {
    console.error('Error fetching software versions:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

app.post('/api/software-versions', async (req, res) => {
  try {
    const { software_id, version, os, download_link } = req.body;
    const userId = req.userId;
    
    // Cek software
    const software = await Software.findByPk(software_id);
    if (!software) {
      return res.status(400).json({ message: 'Software ID tidak valid' });
    }
    
    // Cek kepemilikan software jika bukan admin
    if (req.userRole !== 'admin' && software.user_id !== userId) {
      return res.status(403).json({ message: 'Anda tidak memiliki akses ke software ini' });
    }
    
    const newVersion = await SoftwareVersion.create({
      software_id,
      version,
      os,
      download_link,
      user_id: userId,
      createdAt: new Date()
    });
    
    res.status(201).json({ message: 'Software version berhasil ditambahkan', version: newVersion });
  } catch (error) {
    console.error('Error creating software version:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// License routes
app.get('/api/licenses/available/all', async (req, res) => {
  try {
    const whereCondition = req.userRole === 'admin' ? {} : { user_id: req.userId };
    
    const licenses = await License.findAll({
      where: whereCondition,
      include: [
        { model: Software, attributes: ["name"] },
        { model: SoftwareVersion, attributes: ["version", "os"] }
      ]
    });
    
    res.status(200).json(licenses);
  } catch (error) {
    console.error('Error fetching licenses:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

app.post('/api/licenses-bulk', async (req, res) => {
  let transaction;

  try {
    transaction = await db.sequelize.transaction({
      isolationLevel: db.Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    });

    const { software_id, license_keys, software_version_id } = req.body;
    const userId = req.userId;

    // Cari software berdasarkan ID
    const software = await Software.findByPk(software_id);
    if (!software) {
      return res.status(400).json({ message: "Software ID tidak valid" });
    }
    
    // Cek kepemilikan software jika bukan admin
    if (req.userRole !== "admin" && software.user_id !== userId) {
      return res.status(403).json({ message: "Anda tidak memiliki akses ke software ini" });
    }

    // Jika software memerlukan versi, pastikan software_version_id valid
    if (software.search_by_version) {
      const softwareVersion = await SoftwareVersion.findByPk(software_version_id);
      if (!softwareVersion) {
        return res.status(400).json({ message: "Software Version ID tidak valid" });
      }
      
      // Cek kepemilikan version jika bukan admin
      if (req.userRole !== "admin" && softwareVersion.user_id !== userId) {
        return res.status(403).json({ message: "Anda tidak memiliki akses ke versi software ini" });
      }
    }

    // Jika software tidak membutuhkan lisensi, kembalikan respon
    if (!software.requires_license) {
      return res.status(400).json({ message: "Software ini tidak memerlukan lisensi" });
    }

    // Pastikan license_keys adalah array yang valid
    if (!Array.isArray(license_keys) || license_keys.length === 0) {
      return res.status(400).json({ message: "License keys harus berupa array dan tidak boleh kosong" });
    }

    // Query untuk mendapatkan lisensi yang sudah ada
    const existingLicenses = await License.findAll({
      where: {
        software_id,
        license_key: license_keys,
        ...(software.search_by_version && { software_version_id }), // Tambahkan filter versi jika diperlukan
      },
      transaction,
      lock: transaction.LOCK.IN_SHARE_MODE,
    });

    // Buat set untuk lisensi yang sudah ada
    const existingKeys = new Set(existingLicenses.map((l) => l.license_key));

    // Filter lisensi baru yang belum ada
    const newLicensesData = license_keys
      .filter((key) => !existingKeys.has(key))
      .map((key) => ({
        software_id,
        software_version_id: software.search_by_version ? software_version_id : null,
        license_key: key,
        is_active: false,
        used_at: null,
        user_id: userId, // Tambahkan user_id
        createdAt: new Date(), // Set createdAt saat pembuatan
      }));

    // Masukkan lisensi baru secara bulk jika ada data baru
    if (newLicensesData.length > 0) {
      await License.bulkCreate(newLicensesData, { transaction });
    }

    await transaction.commit();
    return res.status(201).json({
      message: `${newLicensesData.length} lisensi berhasil ditambahkan`,
      licenses: newLicensesData,
    });
  } catch (error) {
    console.error(error);
    if (transaction) await transaction.rollback();
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
});

// Order routes
app.get('/api/orders', async (req, res) => {
  try {
    const whereCondition = req.userRole === 'admin' ? {} : { user_id: req.userId };
    
    const orders = await Order.findAll({
      where: whereCondition,
      include: [
        {
          model: License,
          through: { attributes: [] },
          attributes: ["id", "license_key", "is_active", "used_at"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Terjadi kesalahan' });
  }
});

app.post('/api/orders/count', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const userId = req.userId;

    const today = new Date();
    let defaultStartDate = new Date();
    defaultStartDate.setDate(today.getDate() - 30);

    const finalStartDate = startDate ? new Date(`${startDate}T00:00:00.000Z`) : defaultStartDate;
    const finalEndDate = endDate ? new Date(`${endDate}T23:59:59.999Z`) : today;

    // Tambahan filter untuk user_id jika bukan admin
    const whereCondition = {
      createdAt: {
        [db.Sequelize.Op.between]: [finalStartDate, finalEndDate],
      }
    };
    
    if (req.userRole !== "admin") {
      whereCondition.user_id = userId;
    }

    const totalOrders = await Order.count({
      where: whereCondition
    });

    res.json({ totalOrders });
  } catch (error) {
    console.error("Error fetching order count:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post('/api/orders/usage', async (req, res) => {
  try {
    let { startDate, endDate } = req.body;
    const userId = req.userId;

    // Jika tidak ada filter, gunakan default 30 hari terakhir
    if (!startDate || !endDate) {
      const today = new Date();
      const last30Days = new Date();
      last30Days.setDate(today.getDate() - 30);

      startDate = startDate || last30Days.toISOString().split("T")[0]; // Format YYYY-MM-DD
      endDate = endDate || today.toISOString().split("T")[0];
    }

    const finalStartDate = startDate ? new Date(`${startDate}T00:00:00.000Z`) : new Date();
    const finalEndDate = endDate ? new Date(`${endDate}T23:59:59.999Z`) : new Date();

    console.log("Filter tanggal:", { finalStartDate, finalEndDate, userId });

    // Gunakan raw query untuk menghindari masalah dengan alias
    const query = `
      SELECT Orders.software_id, COUNT(Orders.software_id) AS count, Software.name
      FROM Orders
      LEFT JOIN Software ON Orders.software_id = Software.id
      WHERE Orders.createdAt BETWEEN ? AND ?
      ${req.userRole !== "admin" ? "AND Orders.user_id = ?" : ""}
      GROUP BY Orders.software_id, Software.id
    `;

    const replacements = [
      finalStartDate,
      finalEndDate,
      ...(req.userRole !== "admin" ? [userId] : [])
    ];

    const orders = await db.sequelize.query(query, {
      replacements,
      type: db.Sequelize.QueryTypes.SELECT
    });

    console.log("Order Usage Data:", orders);

    if (!orders || orders.length === 0) {
      return res.json([]);
    }

    // Format data sesuai yang frontend butuhkan
    const result = orders.map((order) => ({
      name: order.name,
      count: parseInt(order.count),
    }));

    res.json(result);
  } catch (error) {
    console.error("Error fetching order usage:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===================== SUBSCRIPTION AND PAYMENT ENDPOINTS =====================

// Get subscription plans
app.get("/api/subscription-plans", async (req, res) => {
  try {
    const plans = await db.models.SubscriptionPlan.findAll({
      where: { is_active: true },
      order: [['duration_days', 'ASC']]
    });

    res.status(200).json(plans);
  } catch (error) {
    console.error("Error getting subscription plans:", error);
    res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
});

// Get user subscriptions
app.get("/api/subscriptions/user", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    if (userId === "admin") {
      // Untuk admin, berikan respons khusus
      return res.status(200).json([{
        id: 1,
        user_id: "admin",
        start_date: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
        end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 10)),
        status: "active",
        payment_status: "paid",
        payment_method: "manual",
        createdAt: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
        updatedAt: new Date()
      }]);
    }

    const subscriptions = await Subscription.findAll({
      where: { user_id: userId },
      include: [{ model: User, attributes: ['username', 'email'] }],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json(subscriptions);
  } catch (error) {
    console.error("Error getting user subscriptions:", error);
    res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
});

// Create a trial subscription (untuk admin)
app.post("/api/subscriptions", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { user_id, plan_id, payment_method, custom_days } = req.body;
    
    // Validasi input
    if ((!plan_id && !custom_days) || !user_id) {
      return res.status(400).json({ error: "User ID dan Plan ID atau Custom Days harus diisi" });
    }

    // Cek apakah user ada
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }

    let duration_days = custom_days;
    let plan = null;

    // Jika menggunakan plan_id, ambil durasi dari plan
    if (plan_id) {
      plan = await db.models.SubscriptionPlan.findByPk(plan_id);
      if (!plan) {
        return res.status(404).json({ error: "Paket langganan tidak ditemukan" });
      }
      duration_days = plan.duration_days;
    }

    // Hitung tanggal berakhir berdasarkan durasi
    const start_date = new Date();
    const end_date = new Date();
    end_date.setDate(end_date.getDate() + parseInt(duration_days));

    // Cek apakah user sudah memiliki langganan aktif
    const activeSubscription = await Subscription.findOne({
      where: {
        user_id,
        status: "active",
        end_date: {
          [db.Sequelize.Op.gt]: new Date()
        }
      }
    });

    // Jika sudah ada langganan aktif, perpanjang langganan tersebut
    if (activeSubscription) {
      const newEndDate = new Date(activeSubscription.end_date);
      newEndDate.setDate(newEndDate.getDate() + parseInt(duration_days));
      
      await activeSubscription.update({
        end_date: newEndDate,
        payment_status: "paid",
        payment_method: payment_method || "manual"
      });

      return res.status(200).json({
        message: "Langganan berhasil diperpanjang",
        subscription: activeSubscription
      });
    }

    // Buat langganan baru
    const newSubscription = await Subscription.create({
      user_id,
      start_date,
      end_date,
      status: "active",
      payment_status: "paid",
      payment_method: payment_method || "manual"
    });

    return res.status(201).json({
      message: "Langganan berhasil dibuat",
      subscription: newSubscription
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
});

// ===================== SERVER STARTUP =====================

// Start server
app.listen(PORT, async () => {
  try {
    await db.sequelize.authenticate();
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    console.log(`Database terhubung: ${process.env.DB_NAME || 'db_shopee_bot'}@${process.env.DB_HOST || '127.0.0.1'}`);
  } catch (error) {
    console.error("❌ Gagal menyambungkan database:", error);
  }
});