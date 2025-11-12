const express = require("express");
const router = express.Router();
const {
  createPackage,
  getAllPackages,
  getPackageById,
  updatePackage,
  deletePackage,
} = require("../controllers/packageController");
const { authenticateAdmin, authenticateUser } = require("../middleware/auth");
const {
  createPackageValidation,
  updatePackageValidation,
} = require("../validations/packageValidation");

// Routes
router.post("/", authenticateAdmin, createPackageValidation, createPackage);
router.get("/", authenticateUser, getAllPackages);
router.get("/:id", authenticateUser, getPackageById);
router.put("/:id", authenticateAdmin, updatePackageValidation, updatePackage);
router.delete("/:id", authenticateAdmin, deletePackage);

module.exports = router;
