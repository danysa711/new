const express = require("express");
const {
  getAllSubscriptionPlans,
  getSubscriptionPlanById,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  getUserSubscriptions,
  getAllSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscriptionStatus,
  cancelSubscription,
  extendSubscription
} = require("../controllers/subscriptionController");
const { authenticateUser, requireAdmin } = require("../middlewares/auth");

const router = express.Router();

// Routes publik (tanpa auth)
router.get("/subscription-plans", getAllSubscriptionPlans);
router.get("/subscription-plans/:id", getSubscriptionPlanById);

// Routes untuk pengguna yang hanya memerlukan autentikasi
// PENTING: JANGAN gunakan requireActiveSubscription di sini
router.get("/subscriptions/user", authenticateUser, getUserSubscriptions);
router.get("/subscriptions/:id", authenticateUser, getSubscriptionById);
router.put("/subscriptions/:id/cancel", authenticateUser, cancelSubscription);

// Routes admin
router.get("/subscriptions", authenticateUser, requireAdmin, getAllSubscriptions);
router.post("/subscriptions", authenticateUser, requireAdmin, createSubscription);
router.put("/subscriptions/:id/status", authenticateUser, requireAdmin, updateSubscriptionStatus);
router.put("/subscriptions/:id/extend", authenticateUser, requireAdmin, extendSubscription);

// Subscription plan management (admin only)
router.post("/subscription-plans", authenticateUser, requireAdmin, createSubscriptionPlan);
router.put("/subscription-plans/:id", authenticateUser, requireAdmin, updateSubscriptionPlan);
router.delete("/subscription-plans/:id", authenticateUser, requireAdmin, deleteSubscriptionPlan);

module.exports = router;