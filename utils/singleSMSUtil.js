const axios = require("axios");
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
require("dotenv").config();
function createSingleSMSUtil({ token }) {
  const baseUrl = "https://api.geezsms.com/api/v1";
  logger.info({ baseUrl, hasToken: !!token }, 'GeezSMS utility initialized');

  async function sendSingleSMS({ phone, msg, shortcode_id, callback }) {
    const logContext = { phone: phone ? phone.replace(/\d(?=\d{4})/g, '*') : 'undefined' };
    
    logger.info({ ...logContext, msgLength: msg?.length }, 'Preparing to send SMS');
    
    callback = callback || process.env.GEEZSMS_WEBHOOK_URL;
    if (!phone || !msg) {
      const error = new Error("Phone and message are required");
      logger.error({ ...logContext, error: error.message }, 'Validation failed');
      throw error;
    }
    if (phone.startsWith("09")) {
      const original = phone;
      phone = phone.replace(/^09/, "2519");
      logger.debug({ ...logContext, original, formatted: phone }, 'Formatted 09 number');
    } else if (phone.startsWith("07")) {
      const original = phone;
      phone = phone.replace(/^07/, "2517");
      logger.debug({ ...logContext, original, formatted: phone }, 'Formatted 07 number');
    } else if (!phone.startsWith("251")) {
      const error = new Error("Phone number must start with 09, 07, or 251");
      logger.error({ ...logContext, error: error.message }, 'Invalid phone format');
      throw error;
    }
    if (!phone.match(/^251(9|7)\d{7,8}$/)) {
      const error = new Error("Phone must be in format 251[9|7]xxxxxxxx[x]");
      logger.error({ ...logContext, phone, error: error.message }, 'Invalid phone number format');
      throw error;
    }

    const url = `${baseUrl}/sms/send`;
    const formData = new URLSearchParams();
    formData.append("token", token);
    formData.append("phone", phone);
    formData.append("msg", msg);
    
    if (shortcode_id) {
      formData.append("shortcode_id", shortcode_id);
      logger.debug({ ...logContext, shortcode_id }, 'Using shortcode');
    }
    
    if (callback) {
      formData.append("callback", callback);
      logger.debug({ ...logContext, callback }, 'Using callback URL');
    }
    
    logger.debug({
      ...logContext,
      url,
      hasToken: !!token,
      hasShortcode: !!shortcode_id,
      hasCallback: !!callback,
      msgLength: msg.length
    }, 'SMS request prepared');

    try {
      logger.debug({ ...logContext }, 'Sending SMS to GeezSMS API');
      const response = await axios.post(url, formData, {
        headers: { 
          "Content-Type": "application/x-www-form-urlencoded",
          'Content-Length': formData.toString().length
        },
        timeout: 10000 // 10 second timeout
      });
      
      logger.info({ 
        ...logContext, 
        status: response.status,
        statusText: response.statusText,
        messageId: response.data?.api_log_id
      }, 'SMS sent successfully');
      
      return response.data;
    } catch (error) {
      const errorData = {
        ...logContext,
        error: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          timeout: error.config?.timeout
        }
      };
      
      logger.error(errorData, 'Failed to send SMS');
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const errorMessage = error.response.data?.message || 'No error message from server';
        throw new Error(`SMS API Error (${error.response.status}): ${errorMessage}`);
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('No response received from SMS service. The service might be down.');
      } else {
        // Something happened in setting up the request that triggered an Error
        throw new Error(`Request setup error: ${error.message}`);
      }
    }
  }

  return { sendSingleSMS };
}

module.exports = createSingleSMSUtil;
