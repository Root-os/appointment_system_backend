const sequelize = require("../config/db");

// Import all models
const Customer = require("./customer");
const Admin = require("./admin");
const Service = require("./service");
const Package = require("./package");
const Appointment = require("./appointment");
const Order = require("./order");
const Payment = require("./payment");
const Reservation = require("./reservation");
const SMS = require("./sms");

// Define associations
const defineAssociations = () => {
  // Customer associations
  Customer.hasMany(Appointment, { foreignKey: "customerId", as: "appointments" });
  Customer.hasMany(Order, { foreignKey: "customerId", as: "orders" });
  Customer.hasMany(SMS, { foreignKey: "customerId", as: "smsMessages" });

  // Service associations
  Service.hasMany(Order, { foreignKey: "serviceId", as: "orders" });

  // Package associations
  Package.hasMany(Order, { foreignKey: "packageId", as: "orders" });

  // Appointment associations
  Appointment.belongsTo(Customer, { foreignKey: "customerId", as: "customer" });

  // Order associations
  Order.belongsTo(Customer, { foreignKey: "customerId", as: "customer" });
  Order.belongsTo(Service, { foreignKey: "serviceId", as: "service" });
  Order.belongsTo(Package, { foreignKey: "packageId", as: "package" });
  Order.hasOne(Payment, { foreignKey: "orderId", as: "payment" });
  Order.hasOne(Reservation, { foreignKey: "orderId", as: "reservation" });

  // Payment associations
  Payment.belongsTo(Order, { foreignKey: "orderId", as: "order" });

  // Reservation associations
  Reservation.belongsTo(Order, { foreignKey: "orderId", as: "order" });

  // SMS associations
  SMS.belongsTo(Customer, { foreignKey: "customerId", as: "customer" });
};

// Initialize associations
defineAssociations();

module.exports = {
  sequelize,
  Customer,
  Admin,
  Service,
  Package,
  Appointment,
  Order,
  Payment,
  Reservation,
  SMS,
};
