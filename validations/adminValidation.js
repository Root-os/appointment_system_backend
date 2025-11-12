const { body } = require("express-validator");

const registerValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("userName")
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage("Username must be between 3 and 50 characters"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

const loginValidation = [
  body("userName")
    .trim()
    .notEmpty()
    .withMessage("Username is required"),
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
];

module.exports = {
  registerValidation,
  loginValidation,
  updateProfileValidation,
};
