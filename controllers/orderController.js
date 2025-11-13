const { Order, Service, Customer, Package } = require("../models");
const { validationResult } = require("express-validator");
const { Op } = require("sequelize");

// Create order
const createOrder = async (req, res) => {
  try {
        console.log("=== req.body ===", req.body);
    console.log("=== req.file ===", req.file);
    console.log("=== date field ===", req.body.date);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { serviceId, customerId, description, packageId, date, dateCount, status } = req.body;
    const file = req.file ? req.file.path : null;

    // Parse fields because formData sends everything as string
    const parsedDate = date ? new Date(date) : null;
    const parsedServiceId = serviceId ? Number(serviceId) : null;
    const parsedCustomerId = customerId ? Number(customerId) : null;
    const parsedPackageId = packageId ? Number(packageId) : null;
    const parsedDateCount = dateCount ? Number(dateCount) : null;

     console.log("=== parsedDate ===", parsedDate);

    const order = await Order.create({
      serviceId: parsedServiceId,
      customerId: parsedCustomerId,
      description,
      file,
      packageId: parsedPackageId,
      date: parsedDate,
      dateCount: parsedDateCount,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: { order },
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


// Get all orders
const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status = "" } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Service,
          as: "service",
          attributes: ["id", "type", "description"],
        },
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "name", "email", "phone"],
        },
        {
          model: Package,
          as: "package",
          attributes: ["id", "name", "price"],
        },
      ],
      attributes: { exclude: ["customerId", "serviceId", "packageId"]},
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: {
        orders: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get all orders error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [
        {
          model: Service,
          as: "service",
          attributes: ["id", "type", "description"],
        },
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "name", "email", "phone"],
        },
        {
          model: Package,
          as: "package",
          attributes: ["id", "name", "price"],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      data: { order },
    });
  } catch (error) {
    console.error("Get order by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update order
const updateOrder = async (req, res) => {
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
    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const allowedUpdates = ["description", "packageId", "date", "dateCount", "status"];
    const updates = {};
    
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (req.file) {
      updates.file = req.file.path;
    }

    await order.update(updates);

    res.status(200).json({
      success: true,
      message: "Order updated successfully",
      data: { order },
    });
  } catch (error) {
    console.error("Update order error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete order
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    await order.destroy();

    res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("Delete order error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
};
