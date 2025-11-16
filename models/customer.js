const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const bcrypt = require("bcryptjs");

const Customer = sequelize.define("Customer", {
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
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 100],
    },
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

// Hash password before saving
Customer.beforeCreate(async (customer) => {
  if (customer.password) {
    customer.password = await bcrypt.hash(customer.password, 12);
  }
}); 

Customer.beforeUpdate(async (customer) => {
  if (customer.changed("password")) {
    customer.password = await bcrypt.hash(customer.password, 12);
  }
});

// Instance method to check password
Customer.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get name
Customer.prototype.getName = function () {
  return this.name;
};

module.exports = Customer;
