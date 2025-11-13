const { Payment, Order, Reservation, Service, sequelize } = require("../models");
const { validationResult } = require("express-validator");
const { Op } = require("sequelize");

// Create payment
const createPayment = async (req, res) => {
  const t = await sequelize.transaction(); // start transaction
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { orderId, amount, paymentOption, json } = req.body;

    // 1️⃣ Create Payment
    const payment = await Payment.create(
      {
        orderId,
        amount,
        paymentOption,
        status: "completed", // mark as completed
        json: json || {},
      },
      { transaction: t }
    );

    // 2️⃣ Fetch the order with its service
    const order = await Order.findByPk(orderId, { transaction: t });
    if (!order) throw new Error("Order not found");

    const service = await Service.findByPk(order.serviceId, { transaction: t });
    if (!service) throw new Error("Service not found");

    // 3️⃣ Generate Reservation
    if (service.type === "fixed") {
      await Reservation.create(
        {
          orderId,
          date: order.date,
          status: "confirmed",
        },
        { transaction: t }
      );
    } else if (service.type === "perDate" && order.date && order.dateCount) {
      const startDate = new Date(order.date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + order.dateCount - 1);

      await Reservation.create(
        {
          orderId,
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
          status: "confirmed",
        },
        { transaction: t }
      );
    }

    // 4️⃣ Commit transaction
    await t.commit();

    res.status(201).json({
      success: true,
      message: "Payment created and reservation generated successfully",
      data: { payment },
    });
  } catch (error) {
    await t.rollback(); // rollback on error
    console.error("Create payment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all payments
const getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = "" } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await Payment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Order,
          as: "order",
          attributes: ["id", "description"],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: {
        payments: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get all payments error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get payment by ID
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findByPk(id, {
      include: [
        {
          model: Order,
          as: "order",
          attributes: ["id", "description"],
        },
      ],
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.status(200).json({
      success: true,
      data: { payment },
    });
  } catch (error) {
    console.error("Get payment by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update payment
const updatePayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const payment = await Payment.findByPk(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    const allowedUpdates = ["status", "json"];

    const updates = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    await payment.update(updates);

    res.status(200).json({
      success: true,
      message: "Payment updated successfully",
      data: { payment },
    });
  } catch (error) {
    console.error("Update payment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  createPayment,
  getAllPayments,
  getPaymentById,
  updatePayment,
};
