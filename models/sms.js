const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const SMS = sequelize.define("SMS", {
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
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100],
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  status: {
    type: DataTypes.ENUM("pending", "sent", "delivered", "failed"),
    defaultValue: "pending",
  },
});


module.exports = SMS;
