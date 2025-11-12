const express = require("express");
const router = express.Router();
const {
  createAppointment,
  getAllAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
} = require("../controllers/appointmentController");
const { authenticateAdmin, authenticateUser } = require("../middleware/auth");
const {
  createAppointmentValidation,
  updateAppointmentValidation,
} = require("../validations/appointmentValidation");

// Routes
router.post("/", authenticateAdmin, createAppointmentValidation, createAppointment);
router.get("/", authenticateUser, getAllAppointments);
router.get("/:id", authenticateUser, getAppointmentById);
router.put("/:id", authenticateUser, updateAppointmentValidation, updateAppointment);
router.delete("/:id", authenticateUser, deleteAppointment);

module.exports = router;
