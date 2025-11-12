const { Admin } = require("../models");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { Op } = require("sequelize");

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id, type: "admin" }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Register admin
const registerAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { name, userName, password } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      where: { userName },
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin with this username already exists",
      });
    }

    // Create admin
    const admin = await Admin.create({
      name,
      userName,
      password,
    });

    // Generate token
    const token = generateToken(admin.id);

    res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      data: {
        admin: {
          id: admin.id,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          phone: admin.phone,
          role: admin.role,
          permissions: admin.permissions,
          isActive: admin.isActive,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Register admin error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Login admin
const loginAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { userName, password } = req.body;

    // Find admin
    const admin = await Admin.findOne({
      where: { userName },
    });

    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }


    // Generate token
    const token = generateToken(admin.id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        admin: {
          id: admin.id,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          phone: admin.phone,
          role: admin.role,
          permissions: admin.permissions,
          isActive: admin.isActive,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Login admin error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get admin profile
const getProfile = async (req, res) => {
  try {
    const admin = await Admin.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.status(200).json({
      success: true,
      data: { admin },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update admin profile
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const admin = await Admin.findByPk(req.user.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const allowedUpdates = ["name", "userName", "password"];

    const updates = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    await admin.update(updates);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        admin: {
          id: admin.id,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          phone: admin.phone,
          role: admin.role,
          permissions: admin.permissions,
          isActive: admin.isActive,
        },
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all admins (super_admin only)
const getAllAdmins = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", role = "" } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { userName: { [Op.like]: `%${search}%` } },
      ];
    }


    const { count, rows } = await Admin.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ["password"] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: {
        admins: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get all admins error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete admin (super_admin only)
const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findByPk(id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }


    await admin.destroy();

    res.status(200).json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (error) {
    console.error("Delete admin error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  registerAdmin,
  loginAdmin,
  getProfile,
  updateProfile,
  getAllAdmins,
  deleteAdmin,
};
