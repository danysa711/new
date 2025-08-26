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

// Routes yang memerlukan autentikasi
router.use(authenticateUser);

// User subscription routes
router.get("/subscriptions/user", getUserSubscriptions);
router.get("/subscriptions/:id", getSubscriptionById);
router.put("/subscriptions/:id/cancel", cancelSubscription);

// Routes admin
router.get("/subscriptions", requireAdmin, getAllSubscriptions);
router.post("/subscriptions", requireAdmin, createSubscription);
router.put("/subscriptions/:id/status", requireAdmin, updateSubscriptionStatus);
router.put("/subscriptions/:id/extend", requireAdmin, extendSubscription);

// Subscription plan management (admin only)
router.post("/subscription-plans", requireAdmin, createSubscriptionPlan);
router.put("/subscription-plans/:id", requireAdmin, updateSubscriptionPlan);
router.delete("/subscription-plans/:id", requireAdmin, deleteSubscriptionPlan);

module.exports = router;