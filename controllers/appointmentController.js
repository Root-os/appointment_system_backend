const { Appointment, Customer } = require("../models");
const { validationResult } = require("express-validator");
const { Op } = require("sequelize");
const appointmentSMSController = require("./appointmentSMSController");
const logger = require("pino")();

// Create appointment
const createAppointment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { customerId, dateTime, hospitalName } = req.body;

    const appointment = await Appointment.create({
      customerId,
      dateTime,
      hospitalName,
      status: "pending",
    });

    // Send confirmation SMS
    try {
      const customer = await Customer.findByPk(customerId);
      if (customer && customer.phone) {
        const formattedDate = new Date(dateTime).toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        const message = `Dear ${customer.name}, your appointment at ${hospitalName} is scheduled for ${formattedDate}. Status: Pending.`;
        
        logger.info({ customerId: customer.id, phone: customer.phone }, 'Sending appointment confirmation SMS');
        await appointmentSMSController.sendAppointmentSMS(customer.phone, message);
      } else {
        logger.warn({ customerId }, 'Customer not found or missing phone number, skipping SMS');
      }
    } catch (smsError) {
      logger.error({ error: smsError.message }, 'Failed to send appointment confirmation SMS');
      // Don't fail the request if SMS fails
    }

    res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      data: { appointment },
    });
  } catch (error) {
    console.error("Create appointment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all appointments
const getAllAppointments = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status = "" } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { hospitalName: { [Op.like]: `%${search}%` } },
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await Appointment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "name", "email", "phone"],
        },
      ],
      attributes: { exclude: ["customerId"] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: {
        appointments: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get all appointments error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get appointment by ID
const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findByPk(id, {
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "name", "email", "phone"],
        },
      ],
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.status(200).json({
      success: true,
      data: { appointment },
    });
  } catch (error) {
    console.error("Get appointment by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update appointment
const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, dateTime, hospitalName } = req.body;

    const appointment = await Appointment.findByPk(id, {
      include: [{ 
        model: Customer, 
        as: 'customer',
        attributes: ['id', 'name', 'phone', 'email']  
      }]
    });
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Store previous status for comparison
    const previousStatus = appointment.status;

    // Update the appointment
    const updatedAppointment = await appointment.update({
      status: status || appointment.status,
      dateTime: dateTime || appointment.dateTime,
      hospitalName: hospitalName || appointment.hospitalName,
    });

    // Send status update SMS if status changed
    if (status && status !== previousStatus) {
      try {
        if (appointment.customer?.phone) {
          const formattedDate = new Date(updatedAppointment.dateTime).toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          
          let message = '';
          
          switch (status) {
            case 'confirmed':
              message = `Dear ${appointment.customer.name}, your appointment at ${updatedAppointment.hospitalName} on ${formattedDate} has been confirmed.`;
              break;
            case 'rejected':
              message = `Dear ${appointment.customer.name}, we regret to inform you that your appointment at ${updatedAppointment.hospitalName} has been rejected. Please contact us for more information.`;
              break;
            case 'completed':
              message = `Dear ${appointment.customer.name}, thank you for visiting ${updatedAppointment.hospitalName}. We appreciate your trust in our services!`;
              break;
            case 'cancelled':
              message = `Dear ${appointment.customer.name}, your appointment at ${updatedAppointment.hospitalName} on ${formattedDate} has been cancelled.`;
              break;
          }
          
          if (message) {
            logger.info({ 
              appointmentId: id, 
              status, 
              phone: appointment.customer.phone 
            }, 'Sending appointment status update SMS');
            
            await appointmentSMSController.sendAppointmentSMS(
              appointment.customer.phone,
              message
            );
          }
        }
      } catch (smsError) {
        logger.error(
          { error: smsError.message, appointmentId: id },
          'Failed to send status update SMS'
        );
        // Don't fail the request if SMS fails
      }
    }

    res.json({
      success: true,
      message: "Appointment updated successfully",
      data: { appointment: updatedAppointment },
    });
  } catch (error) {
    console.error("Update appointment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete appointment
const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findByPk(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    await appointment.destroy();

    res.status(200).json({
      success: true,
      message: "Appointment deleted successfully",
    });
  } catch (error) {
    console.error("Delete appointment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  createAppointment,
  getAllAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
};
