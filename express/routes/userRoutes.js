// express/routes/userRoutes.js
const express = require("express");
const { getAllUsers, getUserById, getCurrentUser, createUser, updateUser, deleteUser, getUserBySlug } = require("../controllers/userController");
const { authenticateUser, isAdmin } = require("../middlewares/auth");

const router = express.Router();

// Public routes
router.get("/user/slug/:slug", getUserBySlug);

// Protected routes
router.get("/users", authenticateUser, isAdmin, getAllUsers);
router.get("/users/:id", authenticateUser, getUserById);
router.get("/user/profile", authenticateUser, getCurrentUser);
router.post("/users", authenticateUser, isAdmin, createUser);
router.put("/users/:id", authenticateUser, updateUser);
router.delete("/users/:id", authenticateUser, isAdmin, deleteUser);

module.exports = router;