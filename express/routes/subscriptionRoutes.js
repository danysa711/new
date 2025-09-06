// express/routes/subscriptionRoutes.js (Perbarui)
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
  extendSubscription,
  // Fungsi baru
  createUserSubscription,
  getPaymentSettings,
  updatePaymentSettings,
  verifySubscriptionPayment,
  getPendingSubscriptions,
  getUserPendingSubscriptions,
  cancelSubscriptionOrder,
  getUserSubscriptionHistory
} = require("../controllers/subscriptionController");
const { authenticateUser, requireAdmin, requireActiveSubscription } = require("../middlewares/auth");

const router = express.Router();

// Route publik untuk paket langganan (tidak memerlukan autentikasi)
router.get("/subscription-plans", getAllSubscriptionPlans);
router.get("/subscription-plans/:id", getSubscriptionPlanById);

// Routes yang memerlukan autentikasi
router.use(authenticateUser);

// User subscription routes
router.get("/subscriptions/user", getUserSubscriptions);
router.get("/subscriptions/:id", getSubscriptionById);
router.put("/subscriptions/:id/cancel", cancelSubscription);

// Rute baru untuk pengguna
router.post("/subscriptions/order", createUserSubscription); // Buat pesanan baru
router.get("/subscriptions/pending", getUserPendingSubscriptions); // Ambil pesanan menunggu verifikasi
router.delete("/subscriptions/order/:subscription_id", cancelSubscriptionOrder); // Batalkan pesanan

// Admin routes dengan middleware requireAdmin
router.get("/subscriptions", requireAdmin, getAllSubscriptions);
router.post("/subscriptions", requireAdmin, createSubscription);
router.put("/subscriptions/:id/status", requireAdmin, updateSubscriptionStatus);
router.put("/subscriptions/:id/extend", requireAdmin, extendSubscription);
router.get("/subscriptions/history/:userId", requireAdmin, getUserSubscriptionHistory);

// Subscription plan management (admin only)
router.post("/subscription-plans", requireAdmin, createSubscriptionPlan);
router.put("/subscription-plans/:id", requireAdmin, updateSubscriptionPlan);
router.delete("/subscription-plans/:id", requireAdmin, deleteSubscriptionPlan);

// Rute baru untuk admin
router.get("/payment-settings", getPaymentSettings); // Get pengaturan (semua user bisa)
router.put("/payment-settings", requireAdmin, updatePaymentSettings); // Update pengaturan (admin only)
router.post("/subscriptions/verify", requireAdmin, verifySubscriptionPayment); // Verifikasi pembayaran
router.get("/subscriptions/pending/admin", requireAdmin, getPendingSubscriptions); // Lihat semua pending (admin)

module.exports = router;