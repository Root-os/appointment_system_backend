const express = require("express");
const router = express.Router();
const {
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deleteService,
} = require("../controllers/serviceController");
const { authenticateAdmin, authenticateUser } = require("../middleware/auth");
const {
  createServiceValidation,
  updateServiceValidation,
} = require("../validations/serviceValidation");

// Routes
router.post("/", authenticateAdmin, createServiceValidation, createService);
router.get("/", getAllServices);
router.get("/:id", getServiceById);
router.put("/:id", authenticateAdmin, updateServiceValidation, updateService);
router.delete("/:id", authenticateAdmin, deleteService);

module.exports = router;
