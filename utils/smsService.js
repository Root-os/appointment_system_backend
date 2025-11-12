const twilio = require("twilio");
const { SMS } = require("../models");

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Send SMS
const sendSMS = async (phoneNumber, message, messageType = "notification", customerId = null) => {
  try {
    // Create SMS record in database
    const smsRecord = await SMS.create({
      customerId,
      phoneNumber,
      message,
      messageType,
      status: "pending",
      provider: "twilio",
    });

    try {
      // Send SMS via Twilio
      const twilioMessage = await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });

      // Update SMS record with success
      await smsRecord.update({
        status: "sent",
        providerMessageId: twilioMessage.sid,
        sentAt: new Date(),
        cost: parseFloat(twilioMessage.price) || 0,
      });

      return {
        success: true,
        messageId: smsRecord.id,
        providerMessageId: twilioMessage.sid,
      };
    } catch (twilioError) {
      // Update SMS record with failure
      await smsRecord.update({
        status: "failed",
        failedAt: new Date(),
        failureReason: twilioError.message,
      });

      throw twilioError;
    }
  } catch (error) {
    console.error("SMS sending error:", error);
    throw error;
  }
};

// Send appointment confirmation SMS
const sendAppointmentConfirmation = async (customer, appointment, service) => {
  const message = `Hi ${customer.firstName}, your appointment for ${service.name} is confirmed for ${appointment.appointmentDate} at ${appointment.appointmentTime}. Thank you!`;
  
  return await sendSMS(
    customer.phone,
    message,
    "appointment_confirmation",
    customer.id
  );
};

// Send appointment reminder SMS
const sendAppointmentReminder = async (customer, appointment, service) => {
  const message = `Reminder: You have an appointment for ${service.name} tomorrow at ${appointment.appointmentTime}. See you then!`;
  
  return await sendSMS(
    customer.phone,
    message,
    "appointment_reminder",
    customer.id
  );
};

// Send appointment cancellation SMS
const sendAppointmentCancellation = async (customer, appointment, service) => {
  const message = `Your appointment for ${service.name} on ${appointment.appointmentDate} has been cancelled. Please contact us to reschedule.`;
  
  return await sendSMS(
    customer.phone,
    message,
    "appointment_cancellation",
    customer.id
  );
};

// Send payment confirmation SMS
const sendPaymentConfirmation = async (customer, payment, amount) => {
  const message = `Payment of $${amount} has been received successfully. Payment ID: ${payment.paymentNumber}. Thank you!`;
  
  return await sendSMS(
    customer.phone,
    message,
    "payment_confirmation",
    customer.id
  );
};

// Send verification code SMS
const sendVerificationCode = async (phoneNumber, code, customerId = null) => {
  const message = `Your verification code is: ${code}. This code will expire in 10 minutes.`;
  
  return await sendSMS(
    phoneNumber,
    message,
    "verification",
    customerId
  );
};

// Send promotional SMS
const sendPromotionalSMS = async (phoneNumber, message, customerId = null) => {
  return await sendSMS(
    phoneNumber,
    message,
    "promotional",
    customerId
  );
};

// Get SMS delivery status
const getSMSStatus = async (smsId) => {
  try {
    const smsRecord = await SMS.findByPk(smsId);
    
    if (!smsRecord || !smsRecord.providerMessageId) {
      return { status: smsRecord?.status || "not_found" };
    }

    // Check status with Twilio
    const twilioMessage = await client.messages(smsRecord.providerMessageId).fetch();
    
    // Update local record if status changed
    if (twilioMessage.status !== smsRecord.status) {
      const updateData = { status: twilioMessage.status };
      
      if (twilioMessage.status === "delivered") {
        updateData.deliveredAt = new Date();
      } else if (twilioMessage.status === "failed") {
        updateData.failedAt = new Date();
        updateData.failureReason = twilioMessage.errorMessage;
      }
      
      await smsRecord.update(updateData);
    }

    return {
      status: twilioMessage.status,
      deliveredAt: smsRecord.deliveredAt,
      failureReason: smsRecord.failureReason,
    };
  } catch (error) {
    console.error("Error getting SMS status:", error);
    throw error;
  }
};

// Retry failed SMS
const retrySMS = async (smsId) => {
  try {
    const smsRecord = await SMS.findByPk(smsId);
    
    if (!smsRecord) {
      throw new Error("SMS record not found");
    }

    if (!smsRecord.canRetry()) {
      throw new Error("SMS cannot be retried (max retries reached)");
    }

    // Increment retry count
    await smsRecord.incrementRetry();

    // Attempt to resend
    return await sendSMS(
      smsRecord.phoneNumber,
      smsRecord.message,
      smsRecord.messageType,
      smsRecord.customerId
    );
  } catch (error) {
    console.error("Error retrying SMS:", error);
    throw error;
  }
};

module.exports = {
  sendSMS,
  sendAppointmentConfirmation,
  sendAppointmentReminder,
  sendAppointmentCancellation,
  sendPaymentConfirmation,
  sendVerificationCode,
  sendPromotionalSMS,
  getSMSStatus,
  retrySMS,
};
