const { Schema, model } = require("mongoose");
const uuid = require("uuid");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = new Schema({
  company_id: { type: Schema.Types.ObjectId, ref: "Company" },

  // 🔥 MULTI-TENANT FIELD
  storeId: {
    type: Schema.Types.ObjectId,
    ref: "Store",
    required: true,
  },

  staff_id: { type: Schema.Types.ObjectId, ref: "Staff", default: null },

  id: { type: String, unique: true },
  fullName: { type: String, default: "" },
  email: { type: String, unique: true, require: true },
  password: { type: String, require: true },
  phoneNumber: { type: String, default: "" },
  address: { type: String, default: "" },
  city: { type: String, default: "" },
  state: { type: String, default: "" },

  role: {
    type: String,
    enum: ["admin", "manager", "master"],
    default: "manager",
  },

  fcmToken: { type: String, default: "" },
  profileProgress: { type: Number, default: 0 },
  updatedOn: { type: Date },
  createdOn: { type: Date },
});


// ✅ PRE SAVE HOOK (FIXED)
userSchema.pre("save", function (next) {
  this.id = uuid.v1();
  this.updatedOn = new Date();
  this.createdOn = new Date();

  try {
    const salt = bcrypt.genSaltSync(10);
    if (!this.password) {
      throw new Error("Password is missing");
    }
    const hash = bcrypt.hashSync(this.password, salt);
    this.password = hash;
    next();
  } catch (err) {
    next(err);
  }
});


// ✅ UPDATE HOOK
userSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  delete update._id;
  delete update.id;
  this.updatedOn = new Date();
  next();
});


// ✅ ACCESS TOKEN (WITH storeId 🔥)
userSchema.methods.SignAccessToken = function () {
  return jwt.sign(
    { id: this._id, storeId: this.storeId },
    process.env.ACCESS_TOKEN || "",
    { expiresIn: "3h" }
  );
};


// ✅ REFRESH TOKEN (WITH storeId 🔥)
userSchema.methods.SignRefreshToken = function () {
  return jwt.sign(
    { id: this._id, storeId: this.storeId },
    process.env.REFRESH_TOKEN || "",
    { expiresIn: "3d" }
  );
};


const UserModel = model("User", userSchema);

module.exports = UserModel;