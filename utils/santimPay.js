const crypto = require("crypto");
const axios = require("axios");
const fs = require("fs");

function cleanEnvString(value) {
  if (value == null) return null;
  let v = String(value).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  return v.replace(/\\n/g, "\n");
}

function resolvePrivateKeyPem() {
  const pemDirect = cleanEnvString(process.env.PRIVATE_KEY_IN_PEM);
  if (pemDirect && pemDirect.length > 0) {
    return pemDirect;
  }
  const b64 = cleanEnvString(process.env.PRIVATE_KEY_BASE64);
  if (b64 && b64.length > 0) {
    try {
      return Buffer.from(b64, "base64").toString("utf8");
    } catch (_) {}
  }
  const path = cleanEnvString(process.env.PRIVATE_KEY_PATH);
  if (path && path.length > 0) {
    try {
      return fs.readFileSync(path, "utf8");
    } catch (_) {}
  }
  return null;
}

function importPrivateKey(pem) {
  const effectivePem = pem || resolvePrivateKeyPem();
  if (!effectivePem || !String(effectivePem).trim()) {
    throw new Error("SantimPay config error: missing PRIVATE_KEY (set PRIVATE_KEY_IN_PEM, PRIVATE_KEY_BASE64, or PRIVATE_KEY_PATH)");
  }
  return crypto.createPrivateKey({ key: effectivePem, format: "pem" });
}

function signES256(payload, privateKeyPem) {
  const header = { alg: "ES256", typ: "JWT" };
  const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  const unsigned = `${encode(header)}.${encode(payload)}`;
  const sign = crypto.createSign("SHA256");
  sign.update(unsigned);
  sign.end();
  const key = importPrivateKey(privateKeyPem);
  const signature = sign.sign({ key, dsaEncoding: "ieee-p1363" }).toString("base64url");
  return `${unsigned}.${signature}`;
}

const SANTIMPAY_BASE_URL = cleanEnvString(process.env.SANTIMPAY_BASE_URL) || "https://gateway.santimpay.com/api";
const GATEWAY_MERCHANT_ID = cleanEnvString(process.env.GATEWAY_MERCHANT_ID);
const PRIVATE_KEY_PEM = resolvePrivateKeyPem();

// Create a simple axios instance
const httpClient = axios.create({
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'AppointmentSystem/1.0'
  }
});

class SantimPay {
  constructor() {
    if (!GATEWAY_MERCHANT_ID || !PRIVATE_KEY_PEM) {
      throw new Error('SantimPay configuration is missing. Please set GATEWAY_MERCHANT_ID and PRIVATE_KEY_IN_PEM environment variables.');
    }
    console.log('SantimPay initialized with base URL:', SANTIMPAY_BASE_URL);
  }

  generateToken(amount, paymentReason) {
    try {
      const time = Math.floor(Date.now() / 1000);
      const payload = { amount, paymentReason, merchantId: GATEWAY_MERCHANT_ID, generated: time };
      return signES256(payload, PRIVATE_KEY_PEM);
    } catch (error) {
      console.error('Error generating token:', error);
      throw new Error('Failed to generate authentication token');
    }
  }

  async initiatePayment({ orderId, amount, phoneNumber, description, successUrl, failureUrl, notifyUrl }) {
    const txnStartTime = Date.now();
    console.log(`[${new Date().toISOString()}] Initiating payment for order ${orderId}...`);

    try {
      // Ensure orderId is a string
      const orderIdStr = String(orderId);
      
      // Generate auth token
      const signedToken = this.generateToken(amount, description || '');
      console.log('Generated signed token');

      // Prepare request data - matching SantimPay API format
      const requestData = {
        id: orderIdStr,
        amount: amount,
        reason: description || `Payment for order #${orderIdStr}`,
        merchantId: GATEWAY_MERCHANT_ID,
        signedToken: signedToken,
        successRedirectUrl: successUrl || `${process.env.FRONTEND_URL}/payment/success?reference=${orderIdStr}`,
        failureRedirectUrl: failureUrl || `${process.env.FRONTEND_URL}/payment/failed?reference=${orderIdStr}`,
        notifyUrl: notifyUrl || `${process.env.BACKEND_URL}/api/payments/webhook/santimpay`
      };

      // Add phone number if provided
      if (phoneNumber) {
        let formattedPhone = phoneNumber;
        // Remove leading 0 if present
        if (formattedPhone.startsWith('0')) {
          formattedPhone = formattedPhone.substring(1);
        }
        // Add +251 prefix if not already present
        if (!formattedPhone.startsWith('+251')) {
          if (formattedPhone.startsWith('251')) {
            formattedPhone = '+' + formattedPhone;
          } else {
            formattedPhone = '+251' + formattedPhone;
          }
        }
        requestData.phoneNumber = formattedPhone;
      }

      console.log('Payment request data:', JSON.stringify(requestData, null, 2));

      // Make the API request
      console.log('Sending request to SantimPay...');
      const response = await httpClient.post(
        `${SANTIMPAY_BASE_URL}/initiate-payment`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const responseTime = Date.now() - txnStartTime;
      console.log(`[${new Date().toISOString()}] Payment initiated successfully in ${responseTime}ms`);
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return response.data;

    } catch (error) {
      const errorTime = Date.now() - txnStartTime;
      console.error(`[${new Date().toISOString()}] Payment initiation failed after ${errorTime}ms`);

      const errorDetails = {
        message: error.message,
        code: error.code,
        stack: error.stack
      };

      if (error.response) {
        errorDetails.status = error.response.status;
        errorDetails.data = error.response.data;
        errorDetails.headers = error.response.headers;
      } else if (error.request) {
        errorDetails.request = {
          method: error.config?.method,
          url: error.config?.url,
          headers: error.config?.headers,
          data: error.config?.data
        };
      }

      console.error('Error details:', JSON.stringify(errorDetails, null, 2));
      throw new Error(`Payment initiation failed: ${error.message}`);
    }
  }

  async verifyPayment(paymentId) {
    try {
      console.log(`Verifying payment: ${paymentId}`);
      const authToken = this.generateToken(0, paymentId);
      const response = await httpClient.get(
        `${SANTIMPAY_BASE_URL}/v1/payment/verify/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Payment verification failed:', {
        paymentId,
        error: error.message,
        response: error.response?.data
      });
      throw new Error(`Payment verification failed: ${error.message}`);
    }
  }

  validateWebhookSignature(payload, signature) {
    try {
      const hmac = crypto.createHmac('sha256', PRIVATE_KEY_PEM);
      const calculatedSignature = hmac.update(JSON.stringify(payload)).digest('hex');
      return calculatedSignature === signature;
    } catch (error) {
      console.error('Error validating webhook signature:', error);
      return false;
    }
  }
}

module.exports = new SantimPay();