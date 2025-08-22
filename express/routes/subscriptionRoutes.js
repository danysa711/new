// express/routes/subscriptionRoutes.js
const express = require("express");
const {
  getAllSubscriptions,
  getSubscriptionById,
  getUserSubscriptions,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  deleteSubscription,
  getSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  checkSubscriptionStatus,
  extendSubscription,
  approvePayment,
  requestTrialSubscription
} = require("../controllers/subscriptionController");
const { authenticateUser, isAdmin } = require("../middlewares/auth");

const router = express.Router();

// Admin routes
router.get("/subscriptions", authenticateUser, isAdmin, getAllSubscriptions);
router.post("/subscriptions", authenticateUser, isAdmin, createSubscription);
router.get("/subscriptions/:id", authenticateUser, getSubscriptionById);
router.put("/subscriptions/:id", authenticateUser, isAdmin, updateSubscription);
router.delete("/subscriptions/:id", authenticateUser, isAdmin, deleteSubscription);
router.post("/subscription-plans", authenticateUser, isAdmin, createSubscriptionPlan);
router.put("/subscription-plans/:id", authenticateUser, isAdmin, updateSubscriptionPlan);
router.delete("/subscription-plans/:id", authenticateUser, isAdmin, deleteSubscriptionPlan);
router.post("/subscriptions/:subscription_id/approve", authenticateUser, isAdmin, approvePayment);

// User routes
router.get("/user/subscriptions", authenticateUser, getUserSubscriptions);
router.get("/subscription-plans", authenticateUser, getSubscriptionPlans);
router.get("/user/subscription/status", authenticateUser, checkSubscriptionStatus);
router.post("/user/subscription/extend", authenticateUser, extendSubscription);
router.post("/user/subscription/cancel/:id", authenticateUser, cancelSubscription);
router.post("/user/subscription/trial", authenticateUser, requestTrialSubscription);

module.exports = router;