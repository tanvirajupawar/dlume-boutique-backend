const { Schema, model, Types } = require("mongoose");

const serviceSchema = new Schema({
  name: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    default: "",
  },

  rate: {
    type: Number,
    required: true,
  },

  category: {
    type: String,
    default: "",
  },

  company_id: {
    type: Types.ObjectId,
    ref: "Company",
    required: true,
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


serviceSchema.pre("save", function (next) {
  this.updatedOn = new Date();
  if (!this.createdOn) this.createdOn = new Date();
  next();
});


serviceSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  delete update._id;
  this.updatedOn = new Date();
  next();
});


const ServiceModel = model("Service", serviceSchema);

module.exports = ServiceModel;