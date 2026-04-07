const mongoose = require("mongoose");
const OrderModel = require("../models/order_model");
const ReceiptModel = require("../models/receipt_model");
const TaskModel = require("../models/task_model");

const paymentController = {


 // ================= CUSTOMER PAYMENT =================
addPayment: async (req, res) => {
  const storeId = req.user.storeId;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderIds, amount, payment_mode } = req.body;

    // ---------------- VALIDATION ----------------
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      throw new Error("Order IDs are required");
    }

    const numericAmount = Number(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error("Valid payment amount is required");
    }

    if (!payment_mode) {
      throw new Error("Payment mode is required");
    }

    // Convert to paise
    let remainingAmount = Math.round(numericAmount * 100);

    // ---------------- FETCH ORDERS ----------------
 const orders = await OrderModel.find({
  _id: { $in: orderIds },
  storeId
}).session(session);

    // Maintain frontend selection order
    const orderedList = orderIds
      .map(id => orders.find(o => o._id.toString() === id.toString()))
      .filter(Boolean);

    if (orderedList.length !== orderIds.length) {
      throw new Error("Some selected orders not found");
    }

    // ---------------- CHECK TOTAL OUTSTANDING ----------------
    const totalOutstanding = orderedList.reduce((sum, order) => {
      const total = Math.round((Number(order.total) || 0) * 100);
      const paid = Math.round((Number(order.paid_amount) || 0) * 100);
      return sum + Math.max(0, total - paid);
    }, 0);

    if (remainingAmount > totalOutstanding) {
      throw new Error("Payment exceeds total outstanding balance");
    }

    let totalApplied = 0;

    // ---------------- APPLY PAYMENT SEQUENTIALLY ----------------
for (let order of orderedList) {
  if (remainingAmount <= 0) break;

  const total = Math.round((Number(order.total) || 0) * 100);
  const paid = Math.round((Number(order.paid_amount) || 0) * 100);
  const balance = Math.max(0, total - paid);

  if (balance <= 0) continue;

  // ✅ ADD THIS LINE (MISSING)
  const payAmount = Math.min(balance, remainingAmount);

  const newBalance = Math.max(0, balance - payAmount);

await OrderModel.updateOne(
  { _id: order._id, storeId },
    {
      $set: {
        balance: newBalance / 100,
payment_status: newBalance === 0 ? "Paid" : "Partially Paid",      },
    },
    { session }
  );

  remainingAmount -= payAmount;
  totalApplied += payAmount;
}
    if (totalApplied === 0) {
      throw new Error("No pending balance in selected orders");
    }

    // ---------------- CREATE RECEIPT ----------------
 const receipt = await ReceiptModel.create(
  [{
      storeId,
    order_ids: orderIds,
    total_amount: totalApplied / 100,  
    payment_mode,
    receipt_date: new Date(),
  }],
  { session }
);

    await session.commitTransaction();
    session.endSession();

    return res.json({
      success: true,
      message: "Payment recorded successfully",
      receipt: receipt[0],
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
},

  // ================= STAFF PAYMENT =================
  addStaffPayment: async (req, res) => {
    const storeId = req.user.storeId;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { taskIds, amount, payment_mode } = req.body;

      // ---------------- VALIDATION ----------------
      if (!Array.isArray(taskIds) || taskIds.length === 0) {
        throw new Error("Task IDs are required");
      }

      if (isNaN(amount) || Number(amount) <= 0) {
        throw new Error("Valid payment amount is required");
      }

      if (!payment_mode) {
        throw new Error("Payment mode is required");
      }

      let remainingAmount = Math.round(Number(amount) * 100);

      // ---------------- FETCH TASKS ----------------
const tasks = await TaskModel.find({
  _id: { $in: taskIds },
  storeId
}).session(session);

      if (tasks.length !== taskIds.length) {
        throw new Error("Some selected tasks not found");
      }

      let totalApplied = 0;

      // ---------------- APPLY PAYMENT ----------------
      for (let task of tasks) {
        if (remainingAmount <= 0) break;

        const total = Math.round((Number(task.amount) || 0) * 100);
        const paid = Math.round((Number(task.paid_amount) || 0) * 100);
        const balance = Math.max(0, total - paid);

        if (balance <= 0) continue;

        const payAmount = Math.min(balance, remainingAmount);

await TaskModel.updateOne(
  { _id: task._id, storeId },
  {
    $inc: { paid_amount: payAmount / 100 },
  }
).session(session);

        remainingAmount -= payAmount;
        totalApplied += payAmount;
      }

      if (totalApplied === 0) {
        throw new Error("No pending balance in selected tasks");
      }

      await session.commitTransaction();
      session.endSession();

      return res.json({
        success: true,
        message: "Staff payment recorded successfully",
        remaining_amount: remainingAmount / 100,
      });

    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
};

module.exports = paymentController;