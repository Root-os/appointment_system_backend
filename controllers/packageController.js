const { Package } = require("../models");
const { validationResult } = require("express-validator");
const { Op } = require("sequelize");

// Helper function to parse detail field
const parsePackageDetail = (pkg) => {
  if (!pkg) return pkg;
  const parsed = pkg.toJSON ? pkg.toJSON() : { ...pkg };
  if (parsed.detail && typeof parsed.detail === 'string') {
    try {
      parsed.detail = JSON.parse(parsed.detail);
    } catch (e) {
      // If parsing fails, keep as is
    }
  }
  return parsed;
};

// Helper to parse array of packages
const parsePackagesDetail = (packages) => {
  return packages.map(parsePackageDetail);
};

// Create package
const createPackage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { name, price, detail, status } = req.body;

    // Added JSON parsing to ensure detail field is stored as proper JSON object, not stringified
    const packageDetail = typeof detail === 'string' ? JSON.parse(detail) : detail;

    const package = await Package.create({
      name,
      price,
      detail: packageDetail,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Package created successfully",
      data: parsePackageDetail(package),
    });
  } catch (error) {
    console.error("Create package error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all packages
const getAllPackages = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await Package.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      message: "Packages retrieved successfully",
      data: parsePackagesDetail(rows),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Get all packages error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get package by ID
const getPackageById = async (req, res) => {
  try {
    const { id } = req.params;

    const package = await Package.findByPk(id);

    if (!package) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Package retrieved successfully",
      data: parsePackageDetail(package),
    });
  } catch (error) {
    console.error("Get package by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update package
const updatePackage = async (req, res) => {
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
    const package = await Package.findByPk(id);

    if (!package) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    const allowedUpdates = ["name", "price", "detail", "status"];

    const updates = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'detail') {
          updates[field] = typeof req.body[field] === 'string' ? JSON.parse(req.body[field]) : req.body[field];
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    await package.update(updates);

    res.status(200).json({
      success: true,
      message: "Package updated successfully",
      data: parsePackageDetail(package),
    });
  } catch (error) {
    console.error("Update package error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete package
const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;

    const package = await Package.findByPk(id);

    if (!package) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    await package.destroy();

    res.status(200).json({
      success: true,
      message: "Package deleted successfully",
      data: null,
    });
  } catch (error) {
    console.error("Delete package error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  createPackage,
  getAllPackages,
  getPackageById,
  updatePackage,
  deletePackage,
};
