const { SMS, Customer } = require("../models");
const { validationResult } = require("express-validator");
const { Op } = require("sequelize");

// Create SMS
const createSMS = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { customerId, title, description } = req.body;

    const sms = await SMS.create({
      customerId,
      title,
      description,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "SMS created successfully",
      data: { sms },
    });
  } catch (error) {
    console.error("Create SMS error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all SMS
const getAllSMS = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status = "" } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await SMS.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "name", "email", "phone"],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: {
        sms: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get all SMS error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get SMS by ID
const getSMSById = async (req, res) => {
  try {
    const { id } = req.params;

    const sms = await SMS.findByPk(id, {
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "name", "email", "phone"],
        },
      ],
    });

    if (!sms) {
      return res.status(404).json({
        success: false,
        message: "SMS not found",
      });
    }

    res.status(200).json({
      success: true,
      data: { sms },
    });
  } catch (error) {
    console.error("Get SMS by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update SMS
const updateSMS = async (req, res) => {
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
    const sms = await SMS.findByPk(id);

    if (!sms) {
      return res.status(404).json({
        success: false,
        message: "SMS not found",
      });
    }

    const allowedUpdates = ["title", "description", "status"];

    const updates = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    await sms.update(updates);

    res.status(200).json({
      success: true,
      message: "SMS updated successfully",
      data: { sms },
    });
  } catch (error) {
    console.error("Update SMS error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete SMS
const deleteSMS = async (req, res) => {
  try {
    const { id } = req.params;

    const sms = await SMS.findByPk(id);

    if (!sms) {
      return res.status(404).json({
        success: false,
        message: "SMS not found",
      });
    }

    await sms.destroy();

    res.status(200).json({
      success: true,
      message: "SMS deleted successfully",
    });
  } catch (error) {
    console.error("Delete SMS error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  createSMS,
  getAllSMS,
  getSMSById,
  updateSMS,
  deleteSMS,
};
