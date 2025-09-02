const express = require("express");
const { authenticateUser } = require("../middlewares/auth"); // Ubah import menjadi destructuring

const {
  getAllLicenses,
  getLicenseById,
  getLicenseCount,
  getAvailableLicensesCount,
  createLicense,
  updateLicense,
  deleteLicense,
  deleteMultipleLicenses,
  getAllAvailableLicenses,
  getAvailableLicenses,
  activateLicense,
  createMultipleLicenses,
  updateLicenseMultiply,
} = require("../controllers/licenseController");

const router = express.Router();

// Ganti semua authenticateToken menjadi authenticateUser
router.get("/licenses", authenticateUser, getAllLicenses);
router.get("/licenses/:id", authenticateUser, getLicenseById);
router.get("/licenses/available", authenticateUser, getAvailableLicenses);
router.get("/licenses/available/all", authenticateUser, getAllAvailableLicenses);
router.post("/licenses", authenticateUser, createLicense);
router.post("/licenses/count", authenticateUser, getLicenseCount);
router.post("/licenses/available/all/count", authenticateUser, getAvailableLicensesCount);
router.post("/licenses-bulk", authenticateUser, createMultipleLicenses);
router.put("/licenses/:id", authenticateUser, updateLicense);
router.put("/licenses-bulk", authenticateUser, updateLicenseMultiply);
router.delete("/licenses/:id", authenticateUser, deleteLicense);
router.post("/licenses/delete-multiple", authenticateUser, deleteMultipleLicenses);
router.patch("/licenses/:id/activate", authenticateUser, activateLicense);

module.exports = router;