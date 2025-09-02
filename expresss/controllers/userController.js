const { User, Subscription, SubscriptionPlan, db } = require("../models");
const bcrypt = require("bcryptjs");
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

const getAllUsers = async (req, res) => {
  try {
    // Check if the requester is admin
    if (req.userRole !== "admin") {
      console.log("Permintaan ditolak: user bukan admin", req.userRole);
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }

    console.log("Mengambil semua user dengan hak admin");
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'url_slug', 'createdAt'],
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

    const formattedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      url_slug: user.url_slug,
      createdAt: user.createdAt,
      hasActiveSubscription: user.Subscriptions && user.Subscriptions.length > 0,
      subscription: user.Subscriptions && user.Subscriptions.length > 0 ? {
        id: user.Subscriptions[0].id,
        startDate: user.Subscriptions[0].start_date,
        endDate: user.Subscriptions[0].end_date,
        status: user.Subscriptions[0].status,
        paymentStatus: user.Subscriptions[0].payment_status
      } : null
    }));

    return res.status(200).json(formattedUsers);
  } catch (error) {
    console.error("Error mendapatkan user:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

const getUserById = async (req, res) => {
  try {
    // Check if the requester is admin
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }

    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: ['id', 'username', 'email', 'role', 'url_slug', 'createdAt'],
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

    return res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      url_slug: user.url_slug,
      createdAt: user.createdAt,
      hasActiveSubscription: user.Subscriptions && user.Subscriptions.length > 0,
      subscription: user.Subscriptions && user.Subscriptions.length > 0 ? {
        id: user.Subscriptions[0].id,
        startDate: user.Subscriptions[0].start_date,
        endDate: user.Subscriptions[0].end_date,
        status: user.Subscriptions[0].status,
        paymentStatus: user.Subscriptions[0].payment_status
      } : null
    });
  } catch (error) {
    console.error("Error getting user:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

const createUser = async (req, res) => {
  try {
    // Check if the requester is admin
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }

    const { username, email, password, role } = req.body;

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

    // Validasi password (min. 8 karakter, harus ada huruf dan angka)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ error: "Password harus minimal 8 karakter dan mengandung huruf serta angka" });
    }

    // Generate unique URL slug
    const url_slug = await generateUniqueSlug(username);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || "user",
      url_slug
    });

    return res.status(201).json({
      message: "User berhasil dibuat",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        url_slug: user.url_slug
      }
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

const updateUserRole = async (req, res) => {
  try {
    // Check if the requester is admin
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }

    const { id } = req.params;
    const { role } = req.body;

    // Validasi role
    if (!role || !["admin", "user"].includes(role)) {
      return res.status(400).json({ error: "Role tidak valid" });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }

    await user.update({ role });

    return res.status(200).json({
      message: "Role user berhasil diperbarui",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        url_slug: user.url_slug
      }
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

const deleteUser = async (req, res) => {
  try {
    // Check if the requester is admin
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }

    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }

    // Do not allow deleting own account
    if (user.id === req.userId) {
      return res.status(400).json({ error: "Tidak dapat menghapus akun sendiri" });
    }

    await user.destroy();

    return res.status(200).json({ message: "User berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

const resetUserPassword = async (req, res) => {
  try {
    // Check if the requester is admin
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }

    const { id } = req.params;
    const { newPassword } = req.body;

    // Validasi password (min. 8 karakter, harus ada huruf dan angka)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ error: "Password harus minimal 8 karakter dan mengandung huruf serta angka" });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await user.update({ password: hashedPassword });

    return res.status(200).json({ message: "Password user berhasil diatur ulang" });
  } catch (error) {
    console.error("Error resetting user password:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUserRole,
  deleteUser,
  resetUserPassword
};