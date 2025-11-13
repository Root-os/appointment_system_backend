const express = require("express");
const router = express.Router();
const {
  createReservation,
  getAllReservations,
  getReservationById,
  updateReservation,
  deleteReservation,
} = require("../controllers/reservationController");
const { authenticateUser } = require("../middleware/auth");
const {
  createReservationValidation,
  updateReservationValidation,
} = require("../validations/reservationValidation");

// Routes
router.post("/", authenticateUser, createReservationValidation, createReservation);
router.get("/", authenticateUser, getAllReservations);
router.get("/:orderId", authenticateUser, getReservationById);
router.put("/:orderId", authenticateUser, updateReservationValidation, updateReservation);
router.delete("/:orderId", authenticateUser, deleteReservation);

module.exports = router;
