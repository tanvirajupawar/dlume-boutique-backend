const { Schema, model } = require("mongoose");

const productSchema = new Schema({
  category_id: { type: Schema.Types.ObjectId, ref: "Category", required: true },

  title: { type: String, required: [true, "title is required"] },

  price: { type: Number, required: true },

  images: { type: Array, default: [] },

  description: { type: String, default: " " },

  // 🔥 ADD THIS (MULTI-TENANT FIELD)
  storeId: {
    type: Schema.Types.ObjectId,
    ref: "Store",
    required: true,
  },

  updatedOn: { type: Date },
  createdOn: { type: Date },
});


productSchema.pre("save", function (next) {
  this.updatedOn = new Date();
  this.createdOn = new Date();
  next();
});


productSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  delete update._id;
  this.updatedOn = new Date();
  next();
});


const productModel = model("Product", productSchema);

module.exports = productModel;