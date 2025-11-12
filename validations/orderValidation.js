const { body } = require("express-validator");

const createOrderValidation = [
  body("serviceId")
    .isInt({ min: 1 })
    .withMessage("Valid service ID is required"),
  body("customerId")
    .isInt({ min: 1 })
    .withMessage("Valid customer ID is required"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 1000 characters"),
];

const updateOrderValidation = [
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
