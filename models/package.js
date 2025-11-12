const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Package = sequelize.define("Package", {
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
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

module.exports = Package;
