const mongoose = require("mongoose");

const orderDetailSchema = new mongoose.Schema(
  {
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "orders",
      required: true,
    },

    name: String,
    price: Number,
    delivery_date: String,
    description: String,
    design_notes: String,
    measurements: Object,
    extraWork: Array,
    clothImage: String,
    designImage: String,

    // 🔥 ADD THIS (MULTI-TENANT FIELD)
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("order_details", orderDetailSchema);