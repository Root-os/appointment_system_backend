const express = require("express");
const router = express.Router();
const {
  createPayment,
  getAllPayments,
  getPaymentById,
  updatePayment,
} = require("../controllers/paymentController");
const { authenticateUser } = require("../middleware/auth");
const {
  createPaymentValidation,
  updatePaymentValidation,
} = require("../validations/paymentValidation");

// Routes
router.post("/", createPaymentValidation, createPayment);
router.get("/", authenticateUser, getAllPayments);
router.get("/:id", authenticateUser, getPaymentById);
router.put("/:id", authenticateUser, updatePaymentValidation, updatePayment);

module.exports = router;
