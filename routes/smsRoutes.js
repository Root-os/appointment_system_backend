const express = require("express");
const router = express.Router();
const {
  createSMS,
  getAllSMS,
  getSMSById,
  updateSMS,
  deleteSMS,
} = require("../controllers/smsController");
const appointmentSMSController = require("../controllers/appointmentSMSController");
const { authenticateUser, authenticateAdmin } = require("../middleware/auth");
const {
  createSMSValidation,
  updateSMSValidation,
} = require("../validations/smsValidation");

// General SMS Routes
router.post("/send", authenticateAdmin, createSMSValidation, createSMS);
router.get("/", authenticateUser, getAllSMS);
router.get("/:id", authenticateUser, getSMSById);
router.put("/:id", authenticateAdmin, updateSMSValidation, updateSMS);
router.delete("/:id", authenticateAdmin, deleteSMS);

// Appointment SMS Routes
router.post(
  "/appointment/confirm/:appointmentId",
  authenticateUser,
  async (req, res, next) => {
    try {
      const result = await appointmentSMSController.sendAppointmentConfirmation(
        req.params.appointmentId
      );
      res.status(200).json({
        success: true,
        message: "Appointment confirmation SMS sent successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/appointment/reminder/:appointmentId",
  authenticateUser,
  async (req, res, next) => {
    try {
      const result = await appointmentSMSController.sendAppointmentReminder(
        req.params.appointmentId
      );
      res.status(200).json({
        success: true,
        message: "Appointment reminder SMS sent successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/appointment/followup/:appointmentId",
  authenticateUser,
  async (req, res, next) => {
    try {
      const result = await appointmentSMSController.sendAppointmentFollowUp(
        req.params.appointmentId
      );
      res.status(200).json({
        success: true,
        message: "Follow-up SMS sent successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Manual trigger for testing scheduled job
router.post(
  "/appointment/send-reminders",
  authenticateAdmin,
  async (req, res, next) => {
    try {
      const results = await appointmentSMSController.checkAndSendReminders();
      res.status(200).json({
        success: true,
        message: "Appointment reminders processed",
        results,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
