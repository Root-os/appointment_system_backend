const { body } = require("express-validator");

const createPaymentValidation = [
  body("orderId")
    .isInt({ min: 1 })
    .withMessage("Valid order ID is required"),
  body("amount")
    .isFloat({ min: 0 })
    .withMessage("Amount must be a positive number"),
  body("paymentOption")
    .trim()
    .notEmpty()
    .withMessage("Payment option is required"),
  body("json")
    .optional()
    .isObject()
    .withMessage("JSON must be a valid object"),
];

const updatePaymentValidation = [
  body("status")
    .optional()
    .isIn(["pending", "completed", "failed", "cancelled"])
    .withMessage("Status must be pending, completed, failed, or cancelled"),
  body("json")
    .optional()
    .isObject()
    .withMessage("JSON must be a valid object"),
];

module.exports = {
  createPaymentValidation,
  updatePaymentValidation,
};
