const { Sequelize } = require("sequelize");
require("dotenv").config();

// Connection string approach for no password
const connectionString = `mysql://${process.env.DB_USER}@${process.env.DB_HOST}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME}`;

const sequelize = new Sequelize(connectionString, {
  dialect: "mysql",
  logging: process.env.NODE_ENV === "development" ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true,
  },
});

module.exports = sequelize;
