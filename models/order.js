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
    allowNull: false,
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
});


module.exports = Order;
