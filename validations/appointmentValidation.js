const { body } = require("express-validator");

const createAppointmentValidation = [
  body("customerId")
    .isInt({ min: 1 })
    .withMessage("Valid customer ID is required"),
  body("dateTime")
    .isISO8601()
    .withMessage("Valid date and time is required"),
  body("hospitalName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Hospital name must be between 2 and 100 characters"),
];

const updateAppointmentValidation = [
  body("dateTime")
    .optional()
    .isISO8601()
    .withMessage("Valid date and time is required"),
  body("hospitalName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Hospital name must be between 2 and 100 characters"),
  body("status")
    .optional()
    .isIn(["pending", "confirmed", "completed", "cancelled"])
    .withMessage("Status must be pending, confirmed, completed, or cancelled"),
];

module.exports = {
  createAppointmentValidation,
  updateAppointmentValidation,
};
