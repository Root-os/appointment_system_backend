const { body } = require("express-validator");

const createReservationValidation = [
  body("orderId")
    .isInt({ min: 1 })
    .withMessage("Valid order ID is required"),
  body("startDate")
    .isISO8601()
    .withMessage("Valid start date is required"),
  body("endDate")
    .isISO8601()
    .withMessage("Valid end date is required"),
];

const updateReservationValidation = [
  body("startDate")
    .optional()
    .isISO8601()
    .withMessage("Valid start date is required"),
  body("endDate")
    .optional()
    .isISO8601()
    .withMessage("Valid end date is required"),
  body("status")
    .optional()
    .isIn(["pending", "confirmed", "active", "completed", "cancelled"])
    .withMessage("Status must be pending, confirmed, active, completed, or cancelled"),
];

module.exports = {
  createReservationValidation,
  updateReservationValidation,
};
