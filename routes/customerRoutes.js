const express = require("express");
const router = express.Router();
const {
  registerCustomer,
  loginCustomer,
  getProfile,
  updateProfile,
  getAllCustomers,
} = require("../controllers/customerController");
const { authenticateCustomer, authenticateAdmin } = require("../middleware/auth");
const {
  registerValidation,
  loginValidation,
  updateProfileValidation,
} = require("../validations/customerValidation");

// Routes
router.post("/register", registerValidation, registerCustomer);
router.post("/login", loginValidation, loginCustomer);
router.get("/profile", authenticateCustomer, getProfile);
router.put("/profile", authenticateCustomer, updateProfileValidation, updateProfile);

// Admin only routes
router.get("/", authenticateAdmin, getAllCustomers);

module.exports = router;
