const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Service = sequelize.define("Service", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100],
    },
  },
  type: {
    type: DataTypes.ENUM("perDate", "fixed"),
    allowNull: false,
  },
  costPerDate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0,
    },
  },
  costPerService: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0,
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  dateCount: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
    },
  },
  status: {
    type: DataTypes.ENUM("active", "inactive", "pending"),
    defaultValue: "active",
  },
});

module.exports = Service;
