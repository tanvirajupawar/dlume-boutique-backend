const InvoiceModel = require("../models/invoice_model");
const OrderModel = require("../models/order_model");
const InvoiceDetailsModel = require("../models/invoice_details_model");
const ReceiptModel = require("../models/receipt_model");

const invoiceController = {

  // ✅ GET ALL INVOICES (STORE SAFE)
  index: async function (req, res) {
    try {
const storeId = req.user?.storeId;

if (!storeId) {
  return res.status(401).json({
    success: false,
    message: "Unauthorized - storeId missing",
  });
}
      const invoices = await InvoiceModel.find({ storeId })
        .populate("order_id")
        .populate("client_id");

      return res.status(200).json({ success: true, data: invoices });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch invoices",
        error: error.message || error,
      });
    }
  },

  // ✅ CREATE INVOICE (STORE SAFE + AUTO NUMBER)
  create: async function (req, res) {
    try {
      const storeId = req.user.storeId;

      const {
        order_id,
        invoice_date,
        discount = 0,
        paid_amount = 0,
        notes,
      } = req.body;

      const order = await OrderModel.findOne({
        _id: order_id,
        storeId,
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      let calculatedTotal = 0;

      order.garments.forEach(g => {
        const base = Number(g.price || 0);
        const extra = (g.extraWork || []).reduce(
          (sum, w) => sum + Number(w.amount || 0),
          0
        );
        calculatedTotal += base + extra;
      });

      const finalTotal = calculatedTotal - Number(discount || 0);

      const invoice = await InvoiceModel.create({
        client_id: order.customer_id,
        order_id,
        invoice_date,
        discount,
        paid_amount,
        notes,
        total_amount: finalTotal,
        garments: order.garments,
        storeId, // 🔥 MULTI-TENANT
      });

      return res.status(201).json({
        success: true,
        message: "Invoice created successfully",
        data: invoice,
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Invoice creation failed",
        error: error.message || error,
      });
    }
  },

  // ✅ GET SINGLE INVOICE
  fetch: async function (req, res) {
    try {
      const storeId = req.user.storeId;

      const invoice = await InvoiceModel.findOne({
        _id: req.params.id,
        storeId,
      })
        .populate("client_id")
        .populate("order_id");

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: invoice,
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve invoice",
        error: error.message || error,
      });
    }
  },

  // ✅ FETCH BY ORDER (STORE SAFE)
  fetchByOrder: async function (req, res) {
    try {
      const storeId = req.user.storeId;

      const invoiceDetail = await InvoiceDetailsModel.findOne({
        order_id: req.params.orderId,
        storeId,
      }).populate({
        path: "invoice_id",
        match: { storeId },
        populate: { path: "client_id" }
      });

      if (!invoiceDetail || !invoiceDetail.invoice_id) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found for this order",
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          invoice: invoiceDetail.invoice_id,
        },
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch invoice by order",
        error: error.message || error,
      });
    }
  },

  // ✅ UPDATE
  update: async function (req, res) {
    try {
      const storeId = req.user.storeId;

      const updated = await InvoiceModel.findOneAndUpdate(
        { _id: req.params.id, storeId },
        req.body,
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: "Invoice updated",
        data: updated,
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Update failed",
        error: error.message || error,
      });
    }
  },

  // ✅ DELETE
  delete: async function (req, res) {
    try {
      const storeId = req.user.storeId;

      await InvoiceModel.findOneAndDelete({
        _id: req.params.id,
        storeId,
      });

      return res.status(200).json({
        success: true,
        message: "Invoice deleted",
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Delete failed",
        error: error.message || error,
      });
    }
  },

  // ✅ ADD PAYMENT (FIXED)
  addPayment: async function (req, res) {
    try {
      const storeId = req.user.storeId;

      const invoice = await InvoiceModel.findOne({
        _id: req.params.id,
        storeId,
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }

      const receipt = await ReceiptModel.create({
        ...req.body,
        storeId,
      });

      invoice.paid_amount += receipt.amount;

      if (invoice.paid_amount >= invoice.total_amount) {
        invoice.payment_status = "Paid";
      } else if (invoice.paid_amount > 0) {
        invoice.payment_status = "Partially Paid";
      }

      await invoice.save();

      return res.status(200).json({
        success: true,
        message: "Payment added",
        invoice,
        receipt,
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Payment failed",
        error: error.message || error,
      });
    }
  },

  // ✅ SAVE PAYMENT (FIXED COMPLETELY)
  savePayment: async function (req, res) {
    try {
      const storeId = req.user.storeId;

      const {
        amount,
        payment_method,
        allocations,
        card_no,
        cheque_no,
        transaction_no,
        bank_name,
      } = req.body;

      if (!allocations || allocations.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No order allocations provided",
        });
      }

      const receipts = [];

      const receipt = new ReceiptModel({
        receipt_date: new Date(),
        order_ids: allocations.map(a => a.id),
        amount: amount,
        payment_mode: payment_method,
        transaction_no,
        card_no,
        bank_name,
        cheque_no,
        storeId,
      });

      await receipt.save();
      receipts.push(receipt);

      for (const alloc of allocations) {
        const { id, paid_amount } = alloc;

        if (paid_amount > 0) {
          const order = await OrderModel.findOne({
            _id: id,
            storeId,
          });

          if (!order) continue;

          order.received_amount =
            (order.received_amount || 0) + Number(paid_amount);

          if (order.received_amount >= order.total) {
            order.status = "Paid";
          } else if (order.received_amount > 0) {
            order.status = "Partial Paid";
          } else {
            order.status = "Unpaid";
          }

          await order.save();
        }
      }

      return res.json({
        success: true,
        data: receipts,
        message: "Payment done successfully across invoices",
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Server Error",
        error: error.message || error,
      });
    }
  },

};

module.exports = invoiceController;