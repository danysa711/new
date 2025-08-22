// express/routes/paymentRoutes.js
const express = require("express");
const {
  getAllPaymentMethods,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod
} = require("../controllers/paymentMethodController");
const { authenticateUser, isAdmin } = require("../middlewares/auth");

const router = express.Router();

// Public routes (read-only for payment methods)
router.get("/payment-methods", getAllPaymentMethods);
router.get("/payment-methods/:id", getPaymentMethodById);

// Admin routes (CRUD for payment methods)
router.post("/payment-methods", authenticateUser, isAdmin, createPaymentMethod);
router.put("/payment-methods/:id", authenticateUser, isAdmin, updatePaymentMethod);
router.delete("/payment-methods/:id", authenticateUser, isAdmin, deletePaymentMethod);

module.exports = router;