const express = require("express");
const { getAllSoftware, getSoftwareById, getSoftwareCount, createSoftware, updateSoftware, deleteSoftware } = require("../controllers/softwareController");
const { authenticateUser } = require("../middlewares/auth");
const router = express.Router();

router.get("/software", authenticateUser, getAllSoftware);
router.get("/software/:id", authenticateUser, getSoftwareById);
router.post("/software", authenticateUser, createSoftware);
router.post("/software/count", authenticateUser, getSoftwareCount);
router.put("/software/:id", authenticateUser, updateSoftware);
router.delete("/software/:id", authenticateUser, deleteSoftware);

module.exports = router;