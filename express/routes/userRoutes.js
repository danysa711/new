const express = require("express");
const { getAllUsers, getUserById, createUser, updateUserRole, deleteUser, resetUserPassword } = require("../controllers/userController");
const { authenticateUser, requireAdmin } = require("../middlewares/auth");

const router = express.Router();

// Semua routes ini memerlukan autentikasi dan hak admin
router.use(authenticateUser, requireAdmin);

router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.post("/users", createUser);
router.put("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);
router.put("/users/:id/reset-password", resetUserPassword);

module.exports = router;