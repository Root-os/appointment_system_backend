const createSingleSMSUtil = require("../utils/singleSMSUtil");
const pino = require('pino');
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});
const Appointment = require("../models/appointment");
const Customer = require("../models/customer");
const { Op } = require("sequelize");
const moment = require("moment");

// Load environment variables
require('dotenv').config();

// Log environment configuration
// logger.info('=== SMS Service Initialization ===');
// logger.info(`GEEZSMS_TOKEN: ${process.env.GEEZSMS_TOKEN ? '***' + process.env.GEEZSMS_TOKEN.slice(-4) : 'NOT SET'}`);
// logger.info(`GEEZSMS_SHORTCODE_ID: ${process.env.GEEZSMS_SHORTCODE_ID || 'Not set'}`);
// logger.info(`GEEZSMS_WEBHOOK_URL: ${process.env.GEEZSMS_WEBHOOK_URL || 'Not set'}`);
// logger.info(`APPOINTMENT_REMINDER_HOURS: ${process.env.APPOINTMENT_REMINDER_HOURS || '24 (default)'}`);

// Initialize SMS utility with token
let singleSMSUtil;
try {
  if (!process.env.GEEZSMS_TOKEN) {
    logger.fatal('GEEZSMS_TOKEN is not set in environment variables');
  } else {
    singleSMSUtil = createSingleSMSUtil({
      token: process.env.GEEZSMS_TOKEN,
    });
    logger.info('SMS utility initialized successfully');
  }
} catch (error) {
  logger.fatal({ error: error.message }, 'Failed to initialize SMS utility');
  throw error;
}

const APPOINTMENT_REMINDER_HOURS = parseInt(process.env.APPOINTMENT_REMINDER_HOURS) || 24;
logger.info(`Reminder hours set to: ${APPOINTMENT_REMINDER_HOURS}`);

// Make this function available to other modules
async function sendAppointmentSMS(phone, message, context = {}) {
  const logContext = {
    ...context,
    phone: phone ? phone.replace(/\d(?=\d{4})/g, '*') : 'undefined',
    messageLength: message?.length || 0
  };
  
  logger.info(logContext, 'SMS sending initiated');
  
  if (!phone || !message) {
    const error = new Error('Phone and message are required');
    logger.error({ ...logContext, error: error.message }, 'Validation failed');
    throw error;
  }
  if (!phone || !message) {
    logger.error({ phone, message }, 'Missing phone or message for SMS');
    throw new Error('Phone and message are required');
  }
  
  // Format phone number
  let formattedPhone = phone;
  if (phone.startsWith('0')) {
    formattedPhone = '251' + phone.substring(1);
    logger.debug(`Formatted phone from 0: ${phone} -> ${formattedPhone}`);
  } else if (phone.startsWith('9') || phone.startsWith('7')) {
    formattedPhone = '251' + phone;
    logger.debug(`Formatted phone from 9/7: ${phone} -> ${formattedPhone}`);
  } else if (!phone.startsWith('251')) {
    const error = new Error('Phone number must start with 0, 7, 9, or 251');
    logger.error({ ...logContext, error: error.message }, 'Invalid phone format');
    throw error;
  }
  
  logger.debug({ 
    ...logContext,
    formattedPhone: formattedPhone.replace(/\d(?=\d{4})/g, '*'),
    hasShortcode: !!process.env.GEEZSMS_SHORTCODE_ID,
    hasWebhook: !!process.env.GEEZSMS_WEBHOOK_URL
  }, 'SMS details');
  
  try {
    if (!process.env.GEEZSMS_TOKEN) {
      const error = new Error('SMS service is not properly configured - missing token');
      logger.fatal(error.message);
      throw error;
    }
    
    logger.debug('Using SMS token:', process.env.GEEZSMS_TOKEN.substring(0, 4) + '...');
    
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
      phone: formattedPhone.replace(/\d(?=\d{4})/g, '*'),
      messageId: result?.data?.api_log_id || 'unknown',
      response: result?.data ? 'Success' : 'No response data'
    }, "SMS sent successfully");
    
    // Log to database if needed
    try {
      await SmsLog.create({
        phone: formattedPhone,
        message: message.substring(0, 160), // First 160 chars
        status: 'sent',
        messageId: result?.data?.api_log_id,
        response: JSON.stringify(result?.data || {})
      });
    } catch (dbError) {
      logger.error({ error: dbError.message }, 'Failed to log SMS to database');
    }
    
    return result;
  } catch (error) {
    const errorData = {
      ...logContext,
      error: error.message,
      formattedPhone: formattedPhone.replace(/\d(?=\d{4})/g, '*'),
      response: error.response?.data || 'No response data',
      statusCode: error.response?.status
    };
    
    logger.error(errorData, "Failed to send SMS");
    
    // Log failed attempt to database
    try {
      await SmsLog.create({
        phone: formattedPhone,
        message: message?.substring(0, 160) || 'No message',
        status: 'failed',
        error: error.message,
        response: JSON.stringify(error.response?.data || {})
      });
    } catch (dbError) {
      logger.error({ error: dbError.message }, 'Failed to log failed SMS to database');
    }
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
