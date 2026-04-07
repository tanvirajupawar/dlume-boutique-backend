const { Schema, model } = require("mongoose");

const companySchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, require: true },
  mobile: { type: String, require: true },
  alt_mobile: { type: String, default: "" },
  owner_name: { type: String, default: "" },
  owner_mobile: { type: String, default: "" },
  owner_email: { type: String, default: "" },
  address: { type: String, default: "" },
  area: { type: String, default: "" },
  city: { type: String, default: "" },
  state: { type: String, default: "" },
  country: { type: String, default: "India" },
  pincode: { type: String, default: "" },

  // 🔥 ADD THIS (MULTI-TENANT LINK)
  storeId: {
    type: Schema.Types.ObjectId,
    ref: "Store",
    required: true,
  },

  profileProgress: { type: Number, default: 0 },
  updatedOn: { type: Date },
  createdOn: { type: Date },
});


// ✅ FIXED PRE SAVE
companySchema.pre("save", function (next) {
  this.updatedOn = new Date();
  this.createdOn = new Date();
  next();
});


// ❌ WRONG BEFORE → FIXED NOW
companySchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  delete update._id;
  this.updatedOn = new Date();
  next();
});


const companyModel = model("Company", companySchema);

module.exports = companyModel;