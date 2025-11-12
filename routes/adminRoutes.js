const express = require("express");
const router = express.Router();
const {
  registerAdmin,
  loginAdmin,
  getProfile,
  updateProfile,
  getAllAdmins,
  deleteAdmin,
} = require("../controllers/adminController");
const { authenticateAdmin } = require("../middleware/auth");
const {
  registerValidation,
  loginValidation,
  updateProfileValidation,
} = require("../validations/adminValidation");

// Routes
router.post("/register", registerValidation, registerAdmin);
router.post("/login", loginValidation, loginAdmin);
router.get("/profile", authenticateAdmin, getProfile);
router.put("/profile", authenticateAdmin, updateProfileValidation, updateProfile);

// Super admin only routes
router.get("/", authenticateAdmin, getAllAdmins);
router.delete("/:id", authenticateAdmin, deleteAdmin);

module.exports = router;
