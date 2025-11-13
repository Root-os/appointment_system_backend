const { Reservation, Order, Package } = require("../models");
const { validationResult } = require("express-validator");
const { Op } = require("sequelize");

// Create reservation
const createReservation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { orderId, startDate, endDate } = req.body;

    const reservation = await Reservation.create({
      orderId,
      startDate,
      endDate,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Reservation created successfully",
      data: { reservation },
    });
  } catch (error) {
    console.error("Create reservation error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all reservations
const getAllReservations = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = "" } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await Reservation.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Order,
          as: "order",
          attributes: ["id", "description"],
          include: [
            {
              model: Package,
              as: "package",
              attributes: ["id", "name", "price"],
            },
          ],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: {
        reservations: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get all reservations error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get reservation by composite key
const getReservationById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const reservation = await Reservation.findByPk(orderId, {
      include: [
        {
          model: Order,
          as: "order",
          attributes: ["id", "description"],
          include: [
            {
              model: Package,
              as: "package",
              attributes: ["id", "name", "price"],
            },
          ],
        },
      ],
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found",
      });
    }

    res.status(200).json({
      success: true,
      data: { reservation },
    });
  } catch (error) {
    console.error("Get reservation by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update reservation
const updateReservation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { orderId } = req.params;
    const reservation = await Reservation.findByPk(orderId);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found",
      });
    }

    const allowedUpdates = ["startDate", "endDate", "status"];

    const updates = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    await reservation.update(updates);

    res.status(200).json({
      success: true,
      message: "Reservation updated successfully",
      data: { reservation },
    });
  } catch (error) {
    console.error("Update reservation error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete reservation
const deleteReservation = async (req, res) => {
  try {
    const { orderId } = req.params;

    const reservation = await Reservation.findByPk(orderId);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found",
      });
    }

    await reservation.destroy();

    res.status(200).json({
      success: true,
      message: "Reservation deleted successfully",
    });
  } catch (error) {
    console.error("Delete reservation error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  createReservation,
  getAllReservations,
  getReservationById,
  updateReservation,
  deleteReservation,
};
