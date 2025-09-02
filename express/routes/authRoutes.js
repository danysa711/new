// Perbaikan untuk express/routes/authRoutes.js

const express = require("express");
const { 
  register, 
  login, 
  updateUser, 
  verifyPassword, 
  refreshToken, 
  getUserProfile, 
  getPublicUserProfile, 
  updateBackendUrl 
} = require("../controllers/authController");
const { authenticateUser } = require("../middlewares/auth");

const router = express.Router();

// PENTING: Endpoints login dan register TIDAK menggunakan middleware authenticateUser
router.post("/register", register);
router.post("/login", login);

// Endpoint yang memerlukan autentikasi
router.put("/user", authenticateUser, updateUser);
router.post("/user/password", authenticateUser, verifyPassword);
router.post("/user/refresh", refreshToken);
router.get("/user/profile", authenticateUser, getUserProfile);
router.get("/user/public/:slug", getPublicUserProfile);
router.put("/user/backend-url", authenticateUser, updateBackendUrl);

module.exports = router;