const createSingleSMSUtil = require("../utils/singleSMSUtil");
const logger = require("pino")();
const Appointment = require("../models/appointment");
const Customer = require("../models/customer");
const { Op } = require("sequelize");
const moment = require("moment");
// Load environment variables
require('dotenv').config();

// Initialize SMS utility with token
const singleSMSUtil = createSingleSMSUtil({
  token: process.env.GEEZSMS_TOKEN,
});

const APPOINTMENT_REMINDER_HOURS = parseInt(process.env.APPOINTMENT_REMINDER_HOURS) || 24;

// Make this function available to other modules
async function sendAppointmentSMS(phone, message) {
  if (!phone || !message) {
    logger.error({ phone, message }, 'Missing phone or message for SMS');
    throw new Error('Phone and message are required');
  }
  
  // Ensure phone number is in the correct format
  let formattedPhone = phone;
  if (phone.startsWith('0')) {
    formattedPhone = '251' + phone.substring(1);
  } else if (!phone.startsWith('251')) {
    formattedPhone = '251' + phone;
  }
  
  logger.info({ originalPhone: phone, formattedPhone }, 'Sending SMS to phone');
  
  try {
    if (!process.env.GEEZSMS_TOKEN) {
      logger.error('Missing Geez SMS token in environment variables');
      throw new Error('SMS service is not properly configured - missing token');
    }
    
    logger.info('Sending SMS with token:', process.env.GEEZSMS_TOKEN.substring(0, 5) + '...');
    
    const smsPayload = {
      phone: formattedPhone,
      msg: message,
      callback: process.env.GEEZSMS_WEBHOOK_URL
    };
    
    // Only add shortcode_id if it exists in environment
    if (process.env.GEEZSMS_SHORTCODE_ID) {
      smsPayload.shortcode_id = process.env.GEEZSMS_SHORTCODE_ID;
    }
    
    const result = await singleSMSUtil.sendSingleSMS(smsPayload);
    
    logger.info({ 
      phone: formattedPhone, 
      messageId: result.data?.api_log_id 
    }, "Appointment SMS sent successfully");
    
    return result;
  } catch (error) {
    logger.error({ 
      error: error.message, 
      phone: formattedPhone,
      response: error.response?.data,
      stack: error.stack
    }, "Failed to send appointment SMS");
    throw error;
  }
}

const appointmentSMSController = {
  async updateAppointmentStatus(appointmentId, status) {
    try {
      const validStatuses = ['pending', 'confirmed', 'rejected', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid status. Must be one of: ' + validStatuses.join(', '));
      }

      const appointment = await Appointment.findByPk(appointmentId, {
        include: [{ model: Customer, as: 'customer' }]
      });

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Update status
      const previousStatus = appointment.status;
      await appointment.update({ status });

      // Send appropriate SMS based on status change
      if (status === 'confirmed' && previousStatus !== 'confirmed') {
        await this.sendAppointmentConfirmation(appointmentId);
      } else if (status === 'rejected') {
        await this.sendAppointmentRejection(appointmentId);
      }

      return appointment;
    } catch (error) {
      logger.error(
        { error: error.message, appointmentId, status },
        'Failed to update appointment status'
      );
      throw error;
    }
  },

  async sendAppointmentRejection(appointmentId) {
    try {
      const appointment = await Appointment.findByPk(appointmentId, {
        include: [{ model: Customer, as: 'customer' }]
      });

      if (!appointment || !appointment.customer) {
        throw new Error('Appointment or customer not found');
      }

      const formattedDate = moment(appointment.appointmentDate).format('MMMM Do YYYY, h:mm a');
      const message = `We're sorry, but your appointment on ${formattedDate} has been rejected. Please contact us for more information.`;

      return await sendAppointmentSMS(appointment.customer.phone, message);
    } catch (error) {
      logger.error(
        { error: error.message, appointmentId },
        'Failed to send appointment rejection'
      );
      throw error;
    }
  },
  async sendAppointmentConfirmation(appointmentId) {
    try {
      const appointment = await Appointment.findByPk(appointmentId, {
        include: [{ model: Customer, as: 'customer' }]
      });

      if (!appointment || !appointment.customer) {
        throw new Error('Appointment or customer not found');
      }

      const formattedDate = moment(appointment.appointmentDate).format('MMMM Do YYYY, h:mm a');
      const message = `Your appointment is confirmed for ${formattedDate}. Thank you for choosing us!`;

      return await sendAppointmentSMS(appointment.customer.phone, message);
    } catch (error) {
      logger.error(
        { error: error.message, appointmentId },
        'Failed to send appointment confirmation'
      );
      throw error;
    }
  },

  async sendAppointmentReminder(appointmentId) {
    try {
      const appointment = await Appointment.findByPk(appointmentId, {
        include: [{ model: Customer, as: 'customer' }]
      });

      if (!appointment || !appointment.customer) {
        throw new Error('Appointment or customer not found');
      }

      const formattedDate = moment(appointment.appointmentDate).format('MMMM Do YYYY, h:mm a');
      const message = `Reminder: Your appointment is scheduled for ${formattedDate}. We look forward to seeing you!`;

      return await sendAppointmentSMS(appointment.customer.phone, message);
    } catch (error) {
      logger.error(
        { error: error.message, appointmentId },
        'Failed to send appointment reminder'
      );
      throw error;
    }
  },

  async sendAppointmentFollowUp(appointmentId) {
    try {
      const appointment = await Appointment.findByPk(appointmentId, {
        include: [{ model: Customer, as: 'customer' }]
      });

      if (!appointment || !appointment.customer) {
        throw new Error('Appointment or customer not found');
      }

      const message = 'Thank you for your appointment! We hope to see you again soon.';
      return await sendAppointmentSMS(appointment.customer.phone, message);
    } catch (error) {
      logger.error(
        { error: error.message, appointmentId },
        'Failed to send follow-up message'
      );
      throw error;
    }
  },

  async checkAndSendReminders() {
    try {
      const now = new Date();
      const reminderTime = new Date(now.getTime() + (APPOINTMENT_REMINDER_HOURS * 60 * 60 * 1000));

      const appointments = await Appointment.findAll({
        where: {
          appointmentDate: {
            [Op.between]: [now, reminderTime]
          },
          status: 'confirmed',
          reminderSent: false
        },
        include: [{ model: Customer, as: 'customer' }]
      });

      const results = [];
      for (const appointment of appointments) {
        try {
          const result = await this.sendAppointmentReminder(appointment.id);
          await appointment.update({ reminderSent: true });
          results.push({
            appointmentId: appointment.id,
            status: 'success',
            message: 'Reminder sent successfully',
            data: result
          });
        } catch (error) {
          results.push({
            appointmentId: appointment.id,
            status: 'error',
            message: error.message
          });
        }
      }

      return results;
    } catch (error) {
      logger.error(
        { error: error.message },
        'Failed to check and send reminders'
      );
      throw error;
    }
  }
};

// Export all functions
module.exports = {
  ...appointmentSMSController,
  sendAppointmentSMS  // Make sure this is included in exports
};
