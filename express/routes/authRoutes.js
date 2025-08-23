const express = require("express");
const { 
  register, 
  login, 
  updateUser, 
  verifyPassword, 
  refreshToken, 
  getUserProfile, 
  getPublicUserProfile,
  userSlugLogin // Tambahkan import fungsi baru
} = require("../controllers/authController");
const { authenticateUser } = require("../middlewares/auth");

const router = express.Router();

// Regular routes
router.post("/register", register);
router.post("/login", login);
router.put("/user", authenticateUser, updateUser);
router.post("/user/password", authenticateUser, verifyPassword);
router.post("/user/refresh", refreshToken);
router.get("/user/profile", authenticateUser, getUserProfile);
router.get("/user/public/:slug", getPublicUserProfile);

// Tenant specific routes
router.post("/tenant/:slug/login", userSlugLogin); // Endpoint login untuk tenant spesifik
router.post("/tenant/:slug/refresh", refreshToken); // Endpoint refresh token untuk tenant spesifik

module.exports = router;