// File: express/routes/userRoutes.js

const express = require("express");
const { getAllUsers, getUserById, createUser, updateUserRole, deleteUser, resetUserPassword } = require("../controllers/userController");
const { authenticateUser, requireAdmin } = require("../middlewares/auth");

const router = express.Router();

// Semua routes ini memerlukan autentikasi dan hak admin
// Modifikasi untuk menggunakan parameter admin=true
router.use(authenticateUser);

// Terapkan middleware requireAdmin untuk semua endpoint
router.get("/users", requireAdmin, getAllUsers);
router.get("/users/:id", requireAdmin, getUserById);
router.post("/users", requireAdmin, createUser);
router.put("/users/:id/role", requireAdmin, updateUserRole);
router.delete("/users/:id", requireAdmin, deleteUser);
router.put("/users/:id/reset-password", requireAdmin, resetUserPassword);

module.exports = router;

module.exports = router;