const { Schema, model, Types } = require("mongoose");

const stockManagementSchema = new Schema({ 
  service_id: {
    type: Types.ObjectId,
    ref: "Service"
  },

  company_id: {
    type: Types.ObjectId,
    ref: "Company",
    required: true,
  },

  width: {
    type: String,
    required: true,
  },

  in: {
    type: Number,
    default: 0,
  },

  out: {
    type: Number,
    default: 0,
  },

  rate: {
    type: Number,
    required: true,
  },

  total_stock: {
    type: Number,
    default: 0,
  },

  // 🔥 ADD THIS (MULTI-TENANT FIELD)
  storeId: {
    type: Types.ObjectId,
    ref: "Store",
    required: true,
  },

  createdOn: {
    type: Date,
    default: Date.now,
  },

  updatedOn: {
    type: Date,
    default: Date.now,
  },
});


stockManagementSchema.pre("save", function (next) {
  this.updatedOn = new Date();
  if (!this.createdOn) this.createdOn = new Date();

  // 🔥 FIX: calculate total_stock instead
  this.total_stock = (this.in || 0) - (this.out || 0);

  next();
});


stockManagementSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  delete update._id;

  update.updatedOn = new Date();

  // 🔥 FIX: recalc stock if in/out updated
  if (update.in !== undefined || update.out !== undefined) {
    const inQty = update.in || 0;
    const outQty = update.out || 0;
    update.total_stock = inQty - outQty;
  }

  this.setUpdate(update);
  next();
});


const StockManagementModel = model("StockManagement", stockManagementSchema);
module.exports = StockManagementModel;