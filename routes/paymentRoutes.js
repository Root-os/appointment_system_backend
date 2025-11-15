const express = require("express");
const router = express.Router();
const {
  initiatePayment,
  verifyPayment,
  handleWebhook,
  getAllPayments,
  getPaymentById,
  updatePayment,
} = require("../controllers/paymentController");
const { authenticateUser } = require("../middleware/auth");
const {
  createPaymentValidation,
  updatePaymentValidation,
} = require("../validations/paymentValidation");

// SantimPay Integration Routes
router.post("/initiate", authenticateUser, initiatePayment);
router.get("/verify/:reference", authenticateUser, verifyPayment);
router.post("/webhook/santimpay", handleWebhook);

// Existing Payment Routes
router.post("/", authenticateUser, createPaymentValidation, initiatePayment);
router.get("/", authenticateUser, getAllPayments);
router.get("/:id", authenticateUser, getPaymentById);
router.put("/:id", authenticateUser, updatePaymentValidation, updatePayment);

module.exports = router;
