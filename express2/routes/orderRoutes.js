const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middlewares/auth");
const { createOrder, deleteOrder, getOrderCount, getOrderById, getOrderUsage, getOrders, updateOrder, processOrder, findOrder } = require("../controllers/orderController");

router.get("/orders", authenticateUser, getOrders);
router.get("/orders/:id", authenticateUser, getOrderById);
router.post("/orders/usage", authenticateUser, getOrderUsage);
router.post("/orders/count", authenticateUser, getOrderCount);
router.post("/orders", authenticateUser, createOrder);
router.put("/orders/:id", authenticateUser, updateOrder);
router.delete("/orders/:id", authenticateUser, deleteOrder);
router.post("/orders/process", authenticateUser, processOrder);

// PENTING: Ubah route ini untuk memberikan akses ke semua user
router.post("/orders/find", authenticateUser, findOrder);

module.exports = router;