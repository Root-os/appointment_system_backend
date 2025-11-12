const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const bcrypt = require("bcryptjs");

const Admin = sequelize.define("Admin", {
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
  userName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [3, 50],
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 100],
    },
  },
});

// Hash password before saving
Admin.beforeCreate(async (admin) => {
  if (admin.password) {
    admin.password = await bcrypt.hash(admin.password, 12);
  }
});

Admin.beforeUpdate(async (admin) => {
  if (admin.changed("password")) {
    admin.password = await bcrypt.hash(admin.password, 12);
  }
});

// Instance method to check password
Admin.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get name
Admin.prototype.getName = function () {
  return this.name;
};

module.exports = Admin;
