// express/controllers/userController.js
const { User, Subscription } = require("../models");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// Helper untuk generate URL slug unik
const generateSlug = (username) => {
  const slug = username.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const randomString = crypto.randomBytes(4).toString("hex");
  return `${slug}-${randomString}`;
};

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
      include: [{ model: Subscription }],
    });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat mengambil data pengguna" });
  }
};

// Get user by ID (admin or own account)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.userId;
    const requestingUser = await User.findByPk(requestingUserId);

    // Check if admin or own account
    if (requestingUser.role !== "admin" && requestingUserId !== parseInt(id)) {
      return res.status(403).json({ error: "Tidak diizinkan mengakses data pengguna lain" });
    }

    const user = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
      include: [{ model: Subscription }],
    });

    if (!user) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat mengambil data pengguna" });
  }
};

// Get current user profile
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
      include: [{ model: Subscription }],
    });

    if (!user) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching current user:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat mengambil data pengguna" });
  }
};

// Create new user (for admin)
const createUser = async (req, res) => {
  try {
    const { username, email, password, role = "user" } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: "Username dan password harus diisi" });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: "Username sudah digunakan" });
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ error: "Email sudah digunakan" });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate slug
    const url_slug = generateSlug(username);

    // Create user
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role,
      url_slug,
      url_active: false,
    });

    // Remove password from response
    const userResponse = { ...newUser.toJSON() };
    delete userResponse.password;

    res.status(201).json({ message: "Pengguna berhasil dibuat", user: userResponse });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat membuat pengguna" });
  }
};

// Update user (admin or own account)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.userId;
    const requestingUser = await User.findByPk(requestingUserId);
    const { username, email, role, url_active } = req.body;

    // Check if admin or own account
    if (requestingUser.role !== "admin" && requestingUserId !== parseInt(id)) {
      return res.status(403).json({ error: "Tidak diizinkan mengubah data pengguna lain" });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan" });
    }

    // Only admin can change role and url_active
    const updates = {};
    if (username && username !== user.username) {
      // Check if username already exists
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser && existingUser.id !== parseInt(id)) {
        return res.status(400).json({ error: "Username sudah digunakan" });
      }
      updates.username = username;
      // Update slug if username changes
      updates.url_slug = generateSlug(username);
    }

    if (email && email !== user.email) {
      // Check if email already exists
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail && existingEmail.id !== parseInt(id)) {
        return res.status(400).json({ error: "Email sudah digunakan" });
      }
      updates.email = email;
    }

    // Only admin can change role and url_active
    if (requestingUser.role === "admin") {
      if (role !== undefined) updates.role = role;
      if (url_active !== undefined) updates.url_active = url_active;
    }

    await user.update(updates);

    // Remove password from response
    const userResponse = { ...user.toJSON() };
    delete userResponse.password;

    res.json({ message: "Pengguna berhasil diperbarui", user: userResponse });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat memperbarui pengguna" });
  }
};

// Delete user (admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.userId;
    const requestingUser = await User.findByPk(requestingUserId);

    // Check if admin
    if (requestingUser.role !== "admin") {
      return res.status(403).json({ error: "Hanya admin yang dapat menghapus pengguna" });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan" });
    }

    // Prevent deleting yourself
    if (parseInt(id) === requestingUserId) {
      return res.status(400).json({ error: "Tidak dapat menghapus akun sendiri" });
    }

    await user.destroy();
    res.json({ message: "Pengguna berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat menghapus pengguna" });
  }
};

// Check URL slug availability
const getUserBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const user = await User.findOne({
      where: { url_slug: slug },
      attributes: ["id", "username", "url_slug", "url_active"],
    });

    if (!user) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan" });
    }

    if (!user.url_active) {
      return res.status(403).json({ error: "URL tidak aktif" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user by slug:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat mengambil data pengguna" });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  getCurrentUser,
  createUser,
  updateUser,
  deleteUser,
  getUserBySlug,
};