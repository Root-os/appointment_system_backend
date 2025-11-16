const cron = require('node-cron');
const appointmentSMSController = require('../controllers/appointmentSMSController');
const { Appointment, Customer } = require('../models');
const { Op } = require('sequelize');
const logger = require('pino')();

// Setup scheduled cron jobs for appointment notifications
function setupScheduledJobs() {

  // Run at 10 AM every day to send reminders for appointments in 3 days
  cron.schedule('0 8 * * *', async () => {
    try {
      logger.info('Running scheduled job: Send appointment reminders');

      // Calculate time range for appointments in exactly 3 days
      const now = new Date();
      const threeDaysFromNow = new Date(now);
      threeDaysFromNow.setDate(now.getDate() + 3);
      
      // Set time to beginning of the target day (00:00:00)
      const startOfDay = new Date(threeDaysFromNow);
      startOfDay.setHours(0, 0, 0, 0);
      
      // Set time to end of the target day (23:59:59.999)
      const endOfDay = new Date(threeDaysFromNow);
      endOfDay.setHours(23, 59, 59, 999);

      const appointments = await Appointment.findAll({
        where: {
          dateTime: {
            [Op.between]: [startOfDay, endOfDay]  // All appointments on the target date
          },
          status: 'confirmed'
        },
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name', 'email', 'phone']
          }
        ]
      });

      for (const appointment of appointments) {
        try {
          await appointmentSMSController.sendAppointmentReminder(appointment.id);
          await appointment.update({ reminderSent: true });
        } catch (error) {
          logger.error(
            { error: error.message, appointmentId: appointment.id },
            'Failed to send reminder message'
          );
        }
      }
      
      logger.info('Completed sending appointment reminders');
    } catch (error) {
      logger.error({ error: error.message }, 'Error in scheduled job: sendReminders');
    }
  });


  logger.info('Scheduled jobs have been set up');
}

module.exports = { setupScheduledJobs };
