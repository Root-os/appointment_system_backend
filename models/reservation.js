const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Reservation = sequelize.define(
  "Reservation",
  {
  id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Order",
        key: "id",
      },
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "confirmed",
        "active",
        "completed",
        "cancelled"
      ),
      defaultValue: "pending",
    },
  },
  {
    tableName: "Reservations", // optional: explicit table name
    timestamps: true, // keeps createdAt and updatedAt
  }
);

module.exports = Reservation;
