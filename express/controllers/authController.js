const { User } = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validasi input kosong
    if (!username || !password) {
      return res.status(400).json({ error: "Username dan password harus diisi" });
    }

    // Validasi panjang password (min. 8 karakter, harus ada huruf dan angka)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ error: "Password harus minimal 8 karakter dan mengandung huruf serta angka" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan user
    const user = await User.create({ username, password: hashedPassword });

    res.status(201).json({ message: "User registered", user });
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
    const decoded = jwt.verify(token, process.env.REFRESH_SECRET);

    if (decoded.id === "secret") {
      const newAccessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, { expiresIn: "3d" });

      res.json({ token: newAccessToken });
    } else {
      // Cek apakah token masih valid di database
      const user = await User.findByPk(decoded.id);
      if (!user) {
        return res.status(403).json({ error: "Refresh Token tidak valid!" });
      }

      // Generate Access Token baru (15 menit)
      const newAccessToken = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "3d" });

      res.json({ token: newAccessToken });
    }
  } catch (error) {
    console.error("Refresh Token error:", error);
    res.status(403).json({ error: "Refresh Token tidak valid!" });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validasi input kosong
    if (!username || !password) {
      return res.status(400).json({ error: "Username dan password harus diisi" });
    }

    if (username === "secret" && password === "rahasia") {
      const token = jwt.sign({ id: username }, process.env.JWT_SECRET, { expiresIn: "3d" });
      const refreshToken = jwt.sign({ id: username }, process.env.REFRESH_SECRET, { expiresIn: "7d" });

      res.json({ token, refreshToken });
    } else {
      // Cari user
      const user = await User.findOne({ where: { username } });

      // Jika user tidak ditemukan atau password salah
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Username atau password salah" });
      }

      // Generate Access Token (expire 15 menit)
      const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "3d" });

      // Generate Refresh Token (expire 7 hari)
      const refreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_SECRET, { expiresIn: "7d" });

      res.json({ token, refreshToken });
    }
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

module.exports = { register, login, refreshToken, updateUser, verifyPassword };
