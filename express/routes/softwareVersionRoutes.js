const express = require("express");
const { authenticateUser } = require("../middlewares/auth");
const { getAllSoftwareVersions, getSoftwareVersionById, getSoftwareVersionCount, getSoftwareVersionBySoftwareId, createSoftwareVersion, updateSoftwareVersion, deleteSoftwareVersion } = require("../controllers/softwareVersionController");

const router = express.Router();

router.get("/software-versions", authenticateUser, getAllSoftwareVersions);
router.get("/software-versions/:id", authenticateUser, getSoftwareVersionById);
router.get("/software-versions/:software_id/versions", authenticateUser, getSoftwareVersionBySoftwareId);
router.post("/software-versions", authenticateUser, createSoftwareVersion);
router.post("/software-versions/count", authenticateUser, getSoftwareVersionCount);
router.put("/software-versions/:id", authenticateUser, updateSoftwareVersion);
router.delete("/software-versions/:id", authenticateUser, deleteSoftwareVersion);

module.exports = router;