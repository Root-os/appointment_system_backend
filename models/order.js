const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Order = sequelize.define("Order", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  serviceId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "Service",
      key: "id",
    },
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Customer",
      key: "id",
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  file: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  packageId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "Package",
      key: "id",
    },
  },
  date: {
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
    type: DataTypes.ENUM("pending", "confirmed", "in_progress", "completed", "cancelled"),
    defaultValue: "pending",
  },
});


module.exports = Order;
