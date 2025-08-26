// File: express/routes/userRoutes.js

const express = require("express");
const { getAllUsers, getUserById, createUser, updateUserRole, deleteUser, resetUserPassword } = require("../controllers/userController");
const { authenticateUser, requireAdmin } = require("../middlewares/auth");

const router = express.Router();

// Semua routes ini memerlukan autentikasi dan hak admin
// Modifikasi untuk menggunakan parameter admin=true
router.use(authenticateUser);

// Modifikasi endpoint getAllUsers
router.get("/users", (req, res, next) => {
  console.log("Get users request with admin param:", req.query.admin);
  return requireAdmin(req, res, next);
}, getAllUsers);

// Modifikasi endpoint getUserById
router.get("/users/:id", (req, res, next) => {
  console.log("Get user by id request with admin param:", req.query.admin);
  return requireAdmin(req, res, next);
}, getUserById);

// Modifikasi endpoint createUser
router.post("/users", (req, res, next) => {
  console.log("Create user request with admin param:", req.query.admin);
  return requireAdmin(req, res, next);
}, createUser);

// Modifikasi endpoint updateUserRole
router.put("/users/:id/role", (req, res, next) => {
  console.log("Update user role request with admin param:", req.query.admin);
  return requireAdmin(req, res, next);
}, updateUserRole);

// Modifikasi endpoint deleteUser
router.delete("/users/:id", (req, res, next) => {
  console.log("Delete user request with admin param:", req.query.admin);
  return requireAdmin(req, res, next);
}, deleteUser);

// Modifikasi endpoint resetUserPassword
router.put("/users/:id/reset-password", (req, res, next) => {
  console.log("Reset password request with admin param:", req.query.admin);
  return requireAdmin(req, res, next);
}, resetUserPassword);

module.exports = router;