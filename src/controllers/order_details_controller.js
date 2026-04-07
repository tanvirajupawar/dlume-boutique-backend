const OrderDetail = require("../models/order_details_model");
const Task = require("../models/task_model");
const { uploadToCloudinary } = require("../config/cloudinary");
const fs = require("fs");

// ================= CREATE =================
exports.create = async (req, res) => {
  console.log("🔥 HIT ORDER DETAILS API");

  try {
    const {
      order_id,
      name,
      price,
      delivery_date,
      description,
      design_notes,
      measurements,
      extraWork,
    } = req.body;

    let clothImage = null;
    let designImage = null;

  // 🔥 Upload cloth image
if (req.files?.clothImage?.[0]) {
  const filePath = req.files.clothImage[0].path;

  console.log("📁 Cloth file path:", filePath);

  clothImage = await uploadToCloudinary(filePath);

  console.log("☁️ Cloth uploaded:", clothImage);

  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

    // 🔥 Upload design image
    if (req.files?.designImage?.[0]) {
      const filePath = req.files.designImage[0].path;
console.log("📁 Design file path:", filePath);

      designImage = await uploadToCloudinary(filePath);
console.log("📁 Design file path:", filePath);

      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

const storeId = req.user.storeId;

const newOrderDetail = new OrderDetail({
  ...req.body,
  storeId, 
      name,
      price,
      delivery_date,
      description,
      design_notes,

      measurements:
        typeof measurements === "string"
          ? JSON.parse(measurements || "{}")
          : measurements || {},

      extraWork:
        typeof extraWork === "string"
          ? JSON.parse(extraWork || "[]")
          : extraWork || [],

      clothImage,   // ✅ now URL
      designImage,  // ✅ now URL
    });

    const saved = await newOrderDetail.save();

    console.log("✅ SAVED:", saved);

    res.json({ success: true, data: saved });

  } catch (error) {
    console.log("Order Detail Create Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order detail",
    });
  }
};

// ================= GET BY ORDER =================
exports.getByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;

const storeId = req.user.storeId;

const garments = await OrderDetail.find({
  order_id: orderId,
  storeId
}).lean();

    // attach tasks
    for (let g of garments) {
   const tasks = await Task.find({
  order_detail_id: g._id,
  storeId
});

      g.tasks = tasks;
    }

    res.json({
      success: true,
      data: garments,
    });

  } catch (error) {
    console.log("Fetch garments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch garments",
    });
  }
};

// ================= DELETE =================
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Validate ID
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Garment ID is required",
      });
    }

    // 🔥 Check if garment exists
const storeId = req.user.storeId;

const existing = await OrderDetail.findOne({
  _id: id,
  storeId
});    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Garment not found",
      });
    }

    // 🔥 Delete garment
await OrderDetail.findOneAndDelete({
  _id: id,
  storeId
});
    // 🔥 Delete related tasks
await Task.deleteMany({
  order_detail_id: id,
  storeId
});

    console.log("🗑️ Garment deleted:", id);

    res.json({
      success: true,
      message: "Garment deleted successfully",
    });

  } catch (error) {
    console.log("❌ Delete garment error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete garment",
    });
  }
};