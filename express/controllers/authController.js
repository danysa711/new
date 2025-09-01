const { User, Subscription, db } = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Helper function to generate unique URL slug
const generateUniqueSlug = async (username) => {
  const baseSlug = username.toLowerCase().replace(/[^a-z0-9]/g, "");
  
  // Generate a random string
  const randomString = crypto.randomBytes(4).toString("hex");
  
  const slug = `${baseSlug}-${randomString}`;
  
  // Check if slug exists
  const existingUser = await User.findOne({ where: { url_slug: slug } });
  if (existingUser) {
    // If exists, try again with a different random string
    return generateUniqueSlug(username);
  }
  
  return slug;
};

const register = async (req, res) => {
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

    // Validasi panjang password (min. 8 karakter, harus ada huruf dan angka)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ error: "Password harus minimal 8 karakter dan mengandung huruf serta angka" });
    }

    // Generate unique URL slug
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
      url_slug 
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
        url_slug: user.url_slug
      },
      token,
      refreshToken
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(400).json({ error: error.message || "Terjadi kesalahan" });
  }
};

const refreshToken = async (req, res) => {
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

      // Generate Access Token baru (3 hari)
      const newAccessToken = jwt.sign(
        { id: user.id, username: user.username, role: user.role, url_slug: user.url_slug },
        process.env.JWT_SECRET || "mysecretkey",
        { expiresIn: "3d" }
      );

      res.json({ token: newAccessToken });
    }
  } catch (error) {
    console.error("Refresh Token error:", error);
    res.status(403).json({ error: "Refresh Token tidak valid!" });
  }
};

const login = async (req, res) => {
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

      console.log("Admin token generated:", token.substring(0, 20) + "...");
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
        backend_url: user.backend_url,
        hasActiveSubscription: !!activeSubscription
      }
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: "Terjadi kesalahan, coba lagi nanti" });
  }
};

const updateUser = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: "User tidak ditemukan" });

    // Cek apakah password lama cocok
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Password lama salah" });
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password berhasil diperbarui" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ error: "Terjadi kesalahan, coba lagi nanti" });
  }
};

const verifyPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.userId; // Dapatkan ID user dari token JWT

    // Cari user di database
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }

    // Bandingkan password yang dimasukkan dengan yang ada di database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Password lama salah" });
    }

    res.json({ message: "Password lama benar" });
  } catch (error) {
    console.error("Error verifying password:", error);
    res.status(500).json({ error: "Terjadi kesalahan, coba lagi nanti" });
  }
};

// Tambahkan fungsi untuk mengatur backend URL
const updateBackendUrl = async (req, res) => {
  try {
    const { backend_url } = req.body;
    const userId = req.userId;

    // Validasi URL
    if (!backend_url || !backend_url.match(/^https?:\/\/.+/)) {
      return res.status(400).json({ error: "URL backend tidak valid. Harus dimulai dengan http:// atau https://" });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: "User tidak ditemukan" });

    await user.update({ backend_url });

    res.json({ message: "URL backend berhasil diperbarui", backend_url });
  } catch (error) {
    console.error("Error updating backend URL:", error);
    res.status(500).json({ error: "Terjadi kesalahan, coba lagi nanti" });
  }
};

// Update fungsi getUserProfile untuk menyertakan backend_url
const getUserProfile = async (req, res) => {
  try {
    const userId = req.userId;

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
      return res.status(404).json({ error: "User tidak ditemukan" });
    }

    const hasActiveSubscription = user.Subscriptions && user.Subscriptions.length > 0;

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        url_slug: user.url_slug,
        backend_url: user.backend_url,
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
};

const getPublicUserProfile = async (req, res) => {
  try {
    const { slug } = req.params;

    const user = await User.findOne({
      where: { url_slug: slug },
      attributes: ['id', 'username', 'url_slug', 'createdAt'],
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
      return res.status(404).json({ error: "User tidak ditemukan" });
    }

    res.json({
      user: {
        username: user.username,
        url_slug: user.url_slug,
        createdAt: user.createdAt,
        hasActiveSubscription: user.Subscriptions && user.Subscriptions.length > 0
      }
    });
  } catch (error) {
    console.error("Error fetching public user profile:", error);
    res.status(500).json({ error: "Terjadi kesalahan, coba lagi nanti" });
  }
};

module.exports = { register, login, refreshToken, updateUser, verifyPassword, getUserProfile, getPublicUserProfile, updateBackendUrl, };