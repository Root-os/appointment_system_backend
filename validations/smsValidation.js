const { body } = require("express-validator");

const createSMSValidation = [
  body("customerId")
    .isInt({ min: 1 })
    .withMessage("Valid customer ID is required"),
  body("title")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Title must be between 1 and 100 characters"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required"),
];

const updateSMSValidation = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Title must be between 1 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Description cannot be empty"),
  body("status")
    .optional()
    .isIn(["pending", "sent", "delivered", "failed"])
    .withMessage("Status must be pending, sent, delivered, or failed"),
];

module.exports = {
  createSMSValidation,
  updateSMSValidation,
};
