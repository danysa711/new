const express = require("express");
const { register, login, updateUser, verifyPassword, refreshToken, getUserProfile, getPublicUserProfile } = require("../controllers/authController");
const { authenticateUser } = require("../middlewares/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.put("/user", authenticateUser, updateUser);
router.post("/user/password", authenticateUser, verifyPassword);
router.post("/user/refresh", refreshToken);
router.get("/user/profile", authenticateUser, getUserProfile);
router.get("/user/public/:slug", getPublicUserProfile);
router.put("/user/backend-url", authenticateUser, updateBackendUrl);

module.exports = router;