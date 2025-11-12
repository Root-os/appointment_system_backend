const { body } = require("express-validator");

const createServiceValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Service name must be between 2 and 100 characters"),
  body("type")
    .isIn(["perDate", "fixed"])
    .withMessage("Type must be either perDate or fixed"),
  body("costPerDate")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Cost per date must be a positive number"),
  body("costPerService")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Cost per service must be a positive number"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 1000 characters"),
  body("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid date"),
  body("dateCount")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Date count must be at least 1"),
];

const updateServiceValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Service name must be between 2 and 100 characters"),
  body("type")
    .optional()
    .isIn(["perDate", "fixed"])
    .withMessage("Type must be either perDate or fixed"),
  body("costPerDate")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Cost per date must be a positive number"),
  body("costPerService")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Cost per service must be a positive number"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 1000 characters"),
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
    .isIn(["active", "inactive", "pending"])
    .withMessage("Status must be active, inactive, or pending"),
];

module.exports = {
  createServiceValidation,
  updateServiceValidation,
};
