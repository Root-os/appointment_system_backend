const express = require("express");
const router = express.Router();
const {
  createSMS,
  getAllSMS,
  getSMSById,
  updateSMS,
  deleteSMS,
} = require("../controllers/smsController");
const { authenticateUser, authenticateAdmin } = require("../middleware/auth");
const {
  createSMSValidation,
  updateSMSValidation,
} = require("../validations/smsValidation");

// Routes
router.post("/send", authenticateAdmin, createSMSValidation, createSMS);
router.get("/", authenticateUser, getAllSMS);
router.get("/:id", authenticateUser, getSMSById);
router.put("/:id", authenticateAdmin, updateSMSValidation, updateSMS);
router.delete("/:id", authenticateAdmin, deleteSMS);

module.exports = router;
