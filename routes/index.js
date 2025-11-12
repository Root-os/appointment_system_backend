const express = require("express");
const router = express.Router();

// Import route modules
const customerRoutes = require("./customerRoutes");
const adminRoutes = require("./adminRoutes");
const serviceRoutes = require("./serviceRoutes");
const packageRoutes = require("./packageRoutes");
const appointmentRoutes = require("./appointmentRoutes");
const orderRoutes = require("./orderRoutes");
const paymentRoutes = require("./paymentRoutes");
const reservationRoutes = require("./reservationRoutes");
const smsRoutes = require("./smsRoutes");

// Use routes
router.use("/customers", customerRoutes);
router.use("/admins", adminRoutes);
router.use("/services", serviceRoutes);
router.use("/packages", packageRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/orders", orderRoutes);
router.use("/payments", paymentRoutes);
router.use("/reservations", reservationRoutes);
router.use("/sms", smsRoutes);

// API info endpoint
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Appointment System API",
    version: "1.0.0",
    endpoints: {
      customers: "/api/customers",
      admins: "/api/admins",
      services: "/api/services",
      packages: "/api/packages",
      appointments: "/api/appointments",
      orders: "/api/orders",
      payments: "/api/payments",
      reservations: "/api/reservations",
      sms: "/api/sms",
    },
  });
});

module.exports = router;
