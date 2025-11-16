const { Payment, Order, Reservation, Service, Customer, sequelize } = require("../models");
const { validationResult } = require("express-validator");
const { Op } = require("sequelize");
const santimPay = require("../utils/santimPay");
const appointmentSMSController = require("../controllers/appointmentSMSController");

// Initialize payment with SantimPay
const initiatePayment = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { orderId, amount, phoneNumber, description } = req.body;
    
    // Get order details
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Generate unique payment reference
    const paymentReference = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create payment record
    const payment = await Payment.create(
      {
        orderId,
        amount,
        paymentOption: 'santimpay',
        status: 'pending',
        reference: paymentReference,
      },
      { transaction: t }
    );

    // Initialize SantimPay payment
    const paymentResponse = await santimPay.initiatePayment({
      orderId: paymentReference,
      amount: amount, // Amount is already in the correct format
      phoneNumber,
      description: description || `Payment for order #${orderId}`,
      successUrl: `${process.env.FRONTEND_URL}/payment/success?reference=${paymentReference}`,
      failureUrl: `${process.env.FRONTEND_URL}/payment/failed?reference=${paymentReference}`,
      notifyUrl: `${process.env.BACKEND_URL}/api/payments/webhook/santimpay`,
    });

    // Update payment with transaction ID from SantimPay response
    if (paymentResponse.url) {
      await payment.update(
        {
          json: {
            paymentUrl: paymentResponse.url,
            initiatedAt: new Date().toISOString(),
          },
        },
        { transaction: t }
      );

      // Send SMS with payment URL to customer
      const customer = await Customer.findByPk(order.customerId);
      if (customer) {
        try {
          const smsMessage = `Your payment URL is: ${paymentResponse.url}`;
          await appointmentSMSController.sendAppointmentSMS(customer.phone, smsMessage);
        } catch (error) {
          console.error('Error sending SMS:', error);
        }
      }
    }

    await t.commit();
    
    res.status(200).json({
      success: true,
      message: "Payment initiated successfully",
      data: {
        paymentId: payment.id,
        paymentUrl: paymentResponse.url,
        reference: payment.reference,
        amount: amount,
        orderId: orderId,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error('Payment Initiation Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to initiate payment",
    });
  }
};

// Webhook handler for SantimPay
const handleWebhook = async (req, res) => {
  const { TxnId, Status, thirdPartyId, amount, msisdn } = req.body;

  try {
    console.log('SantimPay Webhook received:', JSON.stringify(req.body, null, 2));

    // Find payment by reference (thirdPartyId from SantimPay)
    const payment = await Payment.findOne({ where: { reference: thirdPartyId } });
    if (!payment) {
      console.warn('Payment not found for reference:', thirdPartyId);
      return res.status(200).json({ 
        success: false, 
        message: "Payment not found",
        thirdPartyId 
      });
    }

    // Update payment status based on webhook status
    const paymentStatus = Status === 'COMPLETED' ? 'completed' : 'failed';
    
    await payment.update({ 
      status: paymentStatus,
      transactionId: TxnId,
      json: {
        ...payment.json,
        webhookData: {
          txnId: TxnId,
          status: Status,
          amount: amount,
          msisdn: msisdn,
          receivedAt: new Date().toISOString(),
        }
      }
    });

    // If payment is completed, update related order status
    if (paymentStatus === 'completed') {
      const order = await Order.findByPk(payment.orderId);
      if (order) {
        await order.update({ status: 'paid' });
        console.log('Order updated to paid status:', payment.orderId);
      }
    }

    console.log('Payment updated successfully:', payment.id);
    res.status(200).json({ 
      success: true, 
      message: "Webhook processed successfully",
      paymentId: payment.id,
      status: paymentStatus
    });
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(200).json({ 
      success: false, 
      message: "Webhook processing failed",
      error: error.message 
    });
  }
};

// Verify payment status
const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;
    const payment = await Payment.findOne({ where: { reference } });
    
    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: "Payment not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: {
        status: payment.status,
        reference: payment.reference,
        amount: payment.amount,
        createdAt: payment.createdAt
      }
    });
  } catch (error) {
    console.error('Payment Verification Error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to verify payment status" 
    });
  }
};

// Get all payments
const getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, paymentOption } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (paymentOption) where.paymentOption = paymentOption;

    const { count, rows: payments } = await Payment.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Order,
          as: "order",
          include: ["customer", "service"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching payments",
    });
  }
};

// Get payment by ID
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findByPk(id, {
      include: [
        {
          model: Order,
          as: "order",
          attributes: ["id", "description"],
        },
      ],
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.status(200).json({
      success: true,
      data: { payment },
    });
  } catch (error) {
    console.error("Get payment by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update payment
const updatePayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const payment = await Payment.findByPk(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    const allowedUpdates = ["status", "json"];

    const updates = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    await payment.update(updates);

    res.status(200).json({
      success: true,
      message: "Payment updated successfully",
      data: { payment },
    });
  } catch (error) {
    console.error("Update payment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  initiatePayment,
  handleWebhook,
  verifyPayment,
  getAllPayments,
  getPaymentById,
  updatePayment,
};
