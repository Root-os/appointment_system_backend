const jwt = require("jsonwebtoken");
const { Customer, Admin } = require("../models");

// Authenticate customer
const authenticateCustomer = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Invalid token type.",
      });
    }

    const customer = await Customer.findByPk(decoded.id, {
      attributes: { exclude: ["password"] },
    });

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Customer not found.",
      });
    }

    req.user = customer;
    next();
  } catch (error) {
    console.error("Customer authentication error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid token.",
    });
  }
};

// Authenticate admin
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Invalid token type.",
      });
    }

    const admin = await Admin.findByPk(decoded.id, {
      attributes: { exclude: ["password"] },
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Admin not found.",
      });
    }

    req.user = admin;
    next();
  } catch (error) {
    console.error("Admin authentication error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid token.",
    });
  }
};

// Authenticate any user (customer or admin)
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user;
    if (decoded.type === "customer") {
      user = await Customer.findByPk(decoded.id, {
        attributes: { exclude: ["password"] },
      });
    } else if (decoded.type === "admin") {
      user = await Admin.findByPk(decoded.id, {
        attributes: { exclude: ["password"] },
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Access denied. User not found.",
      });
    }

    req.user = user;
    req.userType = decoded.type;
    next();
  } catch (error) {
    console.error("User authentication error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid token.",
    });
  }
};

// Check admin permissions
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user || req.userType !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    // Since we simplified the admin model, all admins have full permissions
    next();
  };
};

// Check admin role
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || req.userType !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    // Since we simplified the admin model, all admins have access
    next();
  };
};

module.exports = {
  authenticateCustomer,
  authenticateAdmin,
  authenticateUser,
  checkPermission,
  checkRole,
};
