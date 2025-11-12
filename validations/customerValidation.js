const { body } = require("express-validator");

const registerValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email"),
  body("phone")
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage("Phone number must be between 10 and 15 characters"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("address")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Address must not exceed 500 characters"),
];

const loginValidation = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];

const updateProfileValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("phone")
    .optional()
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage("Phone number must be between 10 and 15 characters"),
  body("address")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Address must not exceed 500 characters"),
];

module.exports = {
  registerValidation,
  loginValidation,
  updateProfileValidation,
};
