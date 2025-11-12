const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Appointment = sequelize.define("Appointment", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Customer",
      key: "id",
    },
  },
  dateTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  hospitalName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100],
    },
  },
  status: {
    type: DataTypes.ENUM("pending", "confirmed", "completed", "cancelled"),
    defaultValue: "pending",
  },
});


module.exports = Appointment;
