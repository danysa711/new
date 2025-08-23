const express = require("express");
const { tenantLogin, tenantTest, tenantRefreshToken } = require("../controllers/tenantController");

const router = express.Router();

// Tenant routes
router.get("/tenant/:slug/test", tenantTest);
router.post("/tenant/:slug/login", tenantLogin);
router.post("/tenant/:slug/refresh", tenantRefreshToken);

module.exports = router;