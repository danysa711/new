const express = require("express");
const subscriptionController = require("../controllers/subscriptionController");
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
  debugSubscriptions
} = subscriptionController;
const { authenticateUser, requireAdmin } = require("../middlewares/auth");

const router = express.Router();

// Route publik untuk paket langganan (tidak memerlukan autentikasi)
router.get("/subscription-plans", getAllSubscriptionPlans);
router.get("/subscription-plans/:id", getSubscriptionPlanById);

// Routes yang memerlukan autentikasi
router.use(authenticateUser);

router.get("/debug/subscriptions", debugSubscriptions);
// User subscription routes
router.get("/subscriptions/user", getUserSubscriptions);
router.get("/subscriptions/:id", getSubscriptionById);
router.put("/subscriptions/:id/cancel", cancelSubscription);
router.post("/subscriptions/purchase", authenticateUser, subscriptionController.purchaseSubscription);
router.post('/subscriptions/purchase-demo', subscriptionController.purchaseSubscriptionDemo);

// Admin routes dengan middleware requireAdmin
router.get("/subscriptions", requireAdmin, getAllSubscriptions);
router.post("/subscriptions", requireAdmin, createSubscription);
router.put("/subscriptions/:id/status", requireAdmin, updateSubscriptionStatus);
router.put("/subscriptions/:id/extend", requireAdmin, extendSubscription);

// Subscription plan management (admin only)
router.post("/subscription-plans", requireAdmin, createSubscriptionPlan);
router.put("/subscription-plans/:id", requireAdmin, updateSubscriptionPlan);
router.delete("/subscription-plans/:id", requireAdmin, deleteSubscriptionPlan);

router.get("/debug/subscriptions", authenticateUser, subscriptionController.debugSubscriptions);

// Tambahkan di tripayRoutes.js juga
router.get("/debug/tripay-config", authenticateUser, (req, res) => {
  try {
    const config = {
      api_key_exists: !!process.env.TRIPAY_API_KEY,
      private_key_exists: !!process.env.TRIPAY_PRIVATE_KEY,
      merchant_code_exists: !!process.env.TRIPAY_MERCHANT_CODE,
      proxy_url: process.env.TRIPAY_PROXY_URL || "default",
      callback_url: process.env.CALLBACK_URL || "default",
      api_key_preview: process.env.TRIPAY_API_KEY ? 
        process.env.TRIPAY_API_KEY.substring(0, 8) + "..." : "not set"
    };
    
    return res.json({
      debug: true,
      tripay_config: config,
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    return res.status(500).json({
      debug: true,
      error: error.message
    });
  }
});

// Route untuk test database connection
router.get("/debug/database", authenticateUser, async (req, res) => {
  try {
    const { db } = require('../models');
    
    // Test connection
    await db.sequelize.authenticate();
    
    // Test basic queries
    const userCount = await db.sequelize.query("SELECT COUNT(*) as count FROM Users", {
      type: db.sequelize.QueryTypes.SELECT
    });
    
    const subscriptionCount = await db.sequelize.query("SELECT COUNT(*) as count FROM subscriptions", {
      type: db.sequelize.QueryTypes.SELECT
    });
    
    // Check if transactions table exists
    let transactionExists = false;
    try {
      await db.sequelize.query("SELECT 1 FROM transactions LIMIT 1");
      transactionExists = true;
    } catch (e) {
      transactionExists = false;
    }
    
    return res.json({
      debug: true,
      database: {
        connection: "OK",
        user_count: userCount[0].count,
        subscription_count: subscriptionCount[0].count,
        transactions_table_exists: transactionExists
      }
    });
  } catch (error) {
    return res.status(500).json({
      debug: true,
      database: {
        connection: "FAILED",
        error: error.message
      }
    });
  }
});

module.exports = router;