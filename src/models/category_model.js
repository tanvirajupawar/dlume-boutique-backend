const { Schema, model } = require("mongoose");

const categorySchema = new Schema({
  title: { type: String, required: [true, "title is required"] },
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

categorySchema.pre("save", function (next) {
  this.updatedOn = new Date();
  this.createdOn = new Date();
  next();
});

categorySchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  delete update._id;
  this.updatedOn = new Date();
  next();
});

const categoryModel = model("Category", categorySchema);

module.exports = categoryModel;