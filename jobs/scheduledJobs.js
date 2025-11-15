const cron = require('node-cron');
const appointmentSMSController = require('../controllers/appointmentSMSController');
const logger = require('pino')();

// Schedule job to run every hour to check for upcoming appointments
function setupScheduledJobs() {
  // Run every hour at minute 0 (e.g., 1:00, 2:00, etc.)
  cron.schedule('0 * * * *', async () => {
    try {
      logger.info('Running scheduled job: Check and send appointment reminders');
      const results = await appointmentSMSController.checkAndSendReminders();
      logger.info({ results }, 'Completed sending appointment reminders');
    } catch (error) {
      logger.error({ error: error.message }, 'Error in scheduled job: checkAndSendReminders');
    }
  });

  // Run at 10 AM every day to send reminders for appointments in 3 days
  cron.schedule('0 10 * * *', async () => {
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
          status: 'confirmed',
          reminderSent: false
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

  // Run at 10 AM every day to send follow-ups for yesterday's appointments
  cron.schedule('0 10 * * *', async () => {
    try {
      logger.info('Running scheduled job: Send follow-up messages');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const appointments = await Appointment.findAll({
        where: {
          appointmentDate: {
            [Op.between]: [
              new Date(yesterday.setHours(0, 0, 0, 0)),
              new Date(yesterday.setHours(23, 59, 59, 999))
            ]
          },
          status: 'completed',
          followUpSent: false
        },
        include: [{ model: Customer, as: 'customer' }]
      });

      for (const appointment of appointments) {
        try {
          await appointmentSMSController.sendAppointmentFollowUp(appointment.id);
          await appointment.update({ followUpSent: true });
        } catch (error) {
          logger.error(
            { error: error.message, appointmentId: appointment.id },
            'Failed to send follow-up message'
          );
        }
      }
      
      logger.info('Completed sending follow-up messages');
    } catch (error) {
      logger.error({ error: error.message }, 'Error in scheduled job: sendFollowUpMessages');
    }
  });

  logger.info('Scheduled jobs have been set up');
}

module.exports = { setupScheduledJobs };
