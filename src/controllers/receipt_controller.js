const ReceiptModel = require("../models/receipt_model");

const receiptController = {

  // ==========================
  // CREATE RECEIPT
  // ==========================
 create: async (req, res) => {
  const storeId = req.user.storeId;
  try {
    const { orders } = req.body;

    // ✅ Extract order_id safely
    const orderId = orders?.[0]?.order_id;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "order_id is required",
      });
    }

    // 🔒 CHECK IF RECEIPT ALREADY EXISTS
 const existingReceipt = await ReceiptModel.findOne({
  "orders.order_id": orderId,
  storeId
});

    if (existingReceipt) {
      console.log("⛔ Duplicate receipt prevented for order:", orderId);

      return res.json({
        success: true,
        message: "Receipt already exists",
        data: existingReceipt,
      });
    }

// 🔢 GENERATE RECEIPT NUMBER (PER STORE)
const lastReceipt = await ReceiptModel.findOne({ storeId })
  .sort({ createdAt: -1 });

let nextNumber = 1;

if (lastReceipt && lastReceipt.receipt_no) {
  const num = parseInt(lastReceipt.receipt_no.replace("R", ""));
  nextNumber = num + 1;
}

const receipt_no = "R" + String(nextNumber).padStart(6, "0");


    // ✅ CREATE NEW RECEIPT
const receipt = new ReceiptModel({
  ...req.body,
  storeId,
  receipt_no 
});  await receipt.save();

    return res.json({
      success: true,
      message: "Receipt created successfully",
      data: receipt,
    });

  } catch (error) {
    console.error("CREATE RECEIPT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
},

  // ==========================
  // FETCH SINGLE RECEIPT
  // ==========================
  fetch: async (req, res) => {
    try {
const storeId = req.user.storeId;

const receipt = await ReceiptModel.findOne({
  _id: req.params.id,
  storeId
}).populate({
  path: "orders.order_id",
  populate: {
    path: "customer_id",
  },
});

      if (!receipt) {
        return res.status(404).json({
          success: false,
          message: "Receipt not found",
        });
      }

      return res.json({
        success: true,
        data: receipt,
      });

    } catch (error) {
      console.error("FETCH RECEIPT ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },


  // ==========================
  // LIST RECEIPTS (PAGINATED)
  // ==========================
 index: async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filter by order_id if provided
const storeId = req.user?.storeId;

if (!storeId) {
  return res.status(401).json({
    success: false,
    message: "Unauthorized - storeId missing",
  });
}

let filter = { storeId };
if (req.query.order_id) {
  filter["orders.order_id"] = req.query.order_id;
}

    const receipts = await ReceiptModel.find(filter)
      .populate({
        path: "orders.order_id",
        populate: { path: "customer_id" },
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await ReceiptModel.countDocuments(filter);

    return res.json({
      success: true,
      data: receipts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error) {
    console.error("LIST RECEIPTS ERROR FULL:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
},


  // ==========================
  // UPDATE RECEIPT
  // ==========================
  update: async (req, res) => {
    try {
  const storeId = req.user.storeId;

const updatedReceipt = await ReceiptModel.findOneAndUpdate(
  { _id: req.params.id, storeId },
  req.body,
  { new: true, runValidators: true }
);

      if (!updatedReceipt) {
        return res.status(404).json({
          success: false,
          message: "Receipt not found",
        });
      }

      return res.json({
        success: true,
        data: updatedReceipt,
      });

    } catch (error) {
      console.error("UPDATE RECEIPT ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },


  // ==========================
  // DELETE RECEIPT
  // ==========================
  delete: async (req, res) => {
    try {
const storeId = req.user.storeId;

const deletedReceipt = await ReceiptModel.findOneAndDelete({
  _id: req.params.id,
  storeId
});
      if (!deletedReceipt) {
        return res.status(404).json({
          success: false,
          message: "Receipt not found",
        });
      }

      return res.json({
        success: true,
        message: "Receipt deleted successfully",
      });

    } catch (error) {
      console.error("DELETE RECEIPT ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },
};

module.exports = receiptController;