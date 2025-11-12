const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Reservation = sequelize.define("Reservation", {
  packageId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Package",
      key: "id",
    },
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Order",
      key: "id",
    },
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("pending", "confirmed", "active", "completed", "cancelled"),
    defaultValue: "pending",
  },
}, {
  // Remove the default id field since we're using composite key
  id: false,
});


module.exports = Reservation;
