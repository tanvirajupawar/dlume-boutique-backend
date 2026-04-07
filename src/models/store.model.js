import mongoose from "mongoose";

const storeSchema = new mongoose.Schema(
  {
    // 🏬 Basic Info
    name: {
      type: String,
      required: true,
      trim: true,
    },

    ownerName: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    phone: String,

    // 🔐 Unique Store Identifier
    storeCode: {
      type: String,
      unique: true,
      index: true, // 🔥 faster lookup later
    },

    // ⚙️ Feature Control
    features: {
      billing: { type: Boolean, default: true },
      inventory: { type: Boolean, default: true },
      customers: { type: Boolean, default: true },
      staff: { type: Boolean, default: false },
      reports: { type: Boolean, default: false },
      services: { type: Boolean, default: false },
      tasks: { type: Boolean, default: false },
    },

    // 🎨 Store Settings
    settings: {
      currency: { type: String, default: "INR" },
      invoicePrefix: { type: String, default: "DL" },
      gstEnabled: { type: Boolean, default: true },
    },

    // 📦 Future Use
    meta: {
      logo: String,
      address: String,
    },

    // 🟢 Status
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Store", storeSchema);