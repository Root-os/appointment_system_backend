const express = require("express");
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
} = require("../controllers/orderController");
const { authenticateCustomer, authenticateUser } = require("../middleware/auth");
const { uploadSingle } = require("../middleware/upload");
const {
  createOrderValidation,
  updateOrderValidation,
} = require("../validations/orderValidation");

// Routes
router.post("/", uploadSingle("file"), createOrderValidation, createOrder);
router.get("/", authenticateUser, getAllOrders);
router.get("/my-orders", authenticateCustomer, getMyOrders);
router.get("/:id", authenticateUser, getOrderById);
router.put("/:id", authenticateUser, uploadSingle("file"), updateOrderValidation, updateOrder);
router.delete("/:id", authenticateUser, deleteOrder);

module.exports = router;
