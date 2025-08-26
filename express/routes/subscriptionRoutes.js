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

// Modifikasi rute ini untuk menerima parameter admin=true
router.get("/subscription-plans", (req, res, next) => {
  // Jika request dengan parameter admin=true, periksa autentikasi dan hak admin
  if (req.query.admin === 'true') {
    return authenticateUser(req, res, () => {
      return requireAdmin(req, res, next);
    });
  }
  // Jika tidak, lanjutkan tanpa autentikasi
  return next();
}, getAllSubscriptionPlans);

router.get("/subscription-plans/:id", getSubscriptionPlanById);

// Routes yang memerlukan autentikasi
router.use(authenticateUser);

// User subscription routes
router.get("/subscriptions/user", getUserSubscriptions);
router.get("/subscriptions/:id", getSubscriptionById);
router.put("/subscriptions/:id/cancel", cancelSubscription);

// Routes admin
// Ubah semua route admin untuk memeriksa parameter admin=true
router.get("/subscriptions", (req, res, next) => {
  return requireAdmin(req, res, next);
}, getAllSubscriptions);

router.post("/subscriptions", (req, res, next) => {
  return requireAdmin(req, res, next);
}, createSubscription);

router.put("/subscriptions/:id/status", (req, res, next) => {
  return requireAdmin(req, res, next);
}, updateSubscriptionStatus);

router.put("/subscriptions/:id/extend", (req, res, next) => {
  return requireAdmin(req, res, next);
}, extendSubscription);

// Subscription plan management (admin only)
router.post("/subscription-plans", requireAdmin, createSubscriptionPlan);
router.put("/subscription-plans/:id", requireAdmin, updateSubscriptionPlan);
router.delete("/subscription-plans/:id", requireAdmin, deleteSubscriptionPlan);

module.exports = router;