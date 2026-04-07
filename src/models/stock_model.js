const { Schema, model, Types } = require("mongoose");

const stockSchema = new Schema({
  service_id: { type: Schema.Types.ObjectId, ref: "Service" },

  company_id: {
    type: Types.ObjectId,
    ref: "Company",
    required: true,
  },

  rate: {
    type: Number,
    required: true,
  },

  width: {
    type: String,
    default: "",
  },

  height: {
    type: String,
    default: "",
  },

  transaction: {
    type: String,
    default: "",
  },

  stock: {
    type: String,
    default: "",
  },

  sqft: {
    type: String,
    default: "",
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


stockSchema.pre("save", function (next) {
  this.updatedOn = new Date();
  if (!this.createdOn) this.createdOn = new Date();
  next();
});


stockSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  delete update._id;
  this.updatedOn = new Date();
  next();
});


const StockModel = model("Stock", stockSchema);

module.exports = StockModel;