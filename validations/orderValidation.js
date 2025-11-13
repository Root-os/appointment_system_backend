const { body } = require("express-validator");

const createOrderValidation = [
  body("serviceId")
    .isInt({ min: 1 })
    .withMessage("Valid service ID is required"),
  body("customerId")
    .isInt({ min: 1 })
    .withMessage("Valid customer ID is required"),
  body("packageId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Valid package ID is required"),
  body("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid date"),
  body("dateCount")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Date count must be at least 1"),
  body("status")
    .optional()
    .isIn(["pending", "confirmed", "in_progress", "completed", "cancelled"])
    .withMessage("Status must be pending, confirmed, in_progress, completed, or cancelled"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 1000 characters"),
];

const updateOrderValidation = [
  body("packageId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Valid package ID is required"),
  body("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid date"),
  body("dateCount")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Date count must be at least 1"),
  body("status")
    .optional()
    .isIn(["pending", "confirmed", "in_progress", "completed", "cancelled"])
    .withMessage("Status must be pending, confirmed, in_progress, completed, or cancelled"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 1000 characters"),
];

module.exports = {
  createOrderValidation,
  updateOrderValidation,
};
