const express = require("express");
const { getUserPublicData, getUserById } = require("../controllers/publicApiController");

const router = express.Router();

// Public API routes
router.get("/user/:slug", getUserPublicData);
router.get("/user/id/:id", getUserById);

module.exports = router;