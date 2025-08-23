const { User, Subscription, db } = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Login untuk tenant berdasarkan slug
const tenantLogin = async (req, res) => {
  try {
    console.log("Tenant login request received:", req.body);
    const { username, password } = req.body;
    const { slug } = req.params; // Ambil slug dari parameter URL

    // Validasi input kosong
    if (!username || !password) {
      return res.status(400).json({ error: "Username dan password harus diisi" });
    }

    // Cari pemilik slug (tenant)
    const tenant = await User.findOne({
      where: { url_slug: slug }
    });

    if (!tenant) {
      return res.status(404).json({ 
        error: "Tenant tidak ditemukan", 
        code: "TENANT_NOT_FOUND" 
      });
    }

    // Cek status langganan tenant
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
        message: "Tenant ini tidak memiliki langganan aktif. Silakan hubungi pemilik tenant."
      });
    }

    // Cari user yang mencoba login
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

    // Periksa apakah user memiliki langganan aktif (untuk fitur tambahan user)
    const userSubscription = await Subscription.findOne({
      where: {
        user_id: user.id,
        status: "active",
        end_date: {
          [db.Sequelize.Op.gt]: new Date()
        }
      }
    });

    // Generate Access Token (expire 3 hari)
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role, 
        url_slug: user.url_slug,
        hasActiveSubscription: !!userSubscription,
        tenant_id: tenant.id,
        tenant_slug: slug
      },
      process.env.JWT_SECRET || "mysecretkey",
      { expiresIn: "3d" }
    );

    // Generate Refresh Token (expire 7 hari)
    const refreshToken = jwt.sign(
      { id: user.id, tenant_slug: slug },
      process.env.REFRESH_SECRET || "mysecretkey",
      { expiresIn: "7d" }
    );

    console.log("Tenant login successful, sending response");
    return res.status(200).json({ 
      token, 
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        url_slug: user.url_slug,
        hasActiveSubscription: !!userSubscription,
        tenant_id: tenant.id,
        tenant_slug: slug
      },
      tenant: {
        id: tenant.id,
        username: tenant.username,
        url_slug: tenant.url_slug
      }
    });
  } catch (error) {
    console.error("Error during tenant login:", error);
    res.status(500).json({ error: "Terjadi kesalahan, coba lagi nanti" });
  }
};

// Endpoint test untuk tenant
const tenantTest = async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Cari tenant berdasarkan slug
    const tenant = await User.findOne({
      where: { url_slug: slug },
      attributes: ['id', 'username', 'url_slug', 'createdAt']
    });

    if (!tenant) {
      return res.status(404).json({ 
        error: "Tenant tidak ditemukan", 
        code: "TENANT_NOT_FOUND" 
      });
    }

    // Cek status langganan
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
        message: "Tenant ini tidak memiliki langganan aktif. Silakan hubungi pemilik tenant."
      });
    }

    // Tambahkan statistik tenant
    const softwareCount = await db.sequelize.models.Software.count({ where: { user_id: tenant.id } });
    const versionCount = await db.sequelize.models.SoftwareVersion.count({ where: { user_id: tenant.id } });
    const licenseCount = await db.sequelize.models.License.count({ where: { user_id: tenant.id } });
    const orderCount = await db.sequelize.models.Order.count({ where: { user_id: tenant.id } });

    res.json({ 
      message: "API is working", 
      tenant: {
        id: tenant.id,
        username: tenant.username,
        url_slug: tenant.url_slug,
        stats: {
          software: softwareCount,
          versions: versionCount,
          licenses: licenseCount,
          orders: orderCount
        }
      },
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error("Error in tenant test endpoint:", error);
    res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

// Refresh token tenant
const tenantRefreshToken = async (req, res) => {
  const { token } = req.body;
  const { slug } = req.params; // Ambil slug dari URL

  if (!token) return res.status(401).json({ error: "Refresh Token diperlukan!" });

  try {
    // Verifikasi Refresh Token
    const decoded = jwt.verify(token, process.env.REFRESH_SECRET || "mysecretkey");

    // Verifikasi jika token tidak memiliki tenant_slug yang sama dengan yang diminta
    if (decoded.tenant_slug && decoded.tenant_slug !== slug) {
      return res.status(403).json({ error: "Refresh Token tidak valid untuk tenant ini!" });
    }

    // Cari tenant berdasarkan slug
    const tenant = await User.findOne({
      where: { url_slug: slug }
    });

    if (!tenant) {
      return res.status(404).json({ 
        error: "Tenant tidak ditemukan", 
        code: "TENANT_NOT_FOUND" 
      });
    }

    // Verifikasi tenant aktif
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
        code: "INACTIVE_TENANT" 
      });
    }

    // Cek apakah user masih valid
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(403).json({ error: "Refresh Token tidak valid!" });
    }
    
    // Periksa apakah user memiliki langganan aktif
    const userSubscription = await Subscription.findOne({
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
        hasActiveSubscription: !!userSubscription,
        tenant_id: tenant.id,
        tenant_slug: slug
      },
      process.env.JWT_SECRET || "mysecretkey",
      { expiresIn: "3d" }
    );

    res.json({ token: newAccessToken });
  } catch (error) {
    console.error("Tenant Refresh Token error:", error);
    res.status(403).json({ error: "Refresh Token tidak valid!" });
  }
};

module.exports = { tenantLogin, tenantTest, tenantRefreshToken };