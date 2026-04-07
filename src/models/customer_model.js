const { Schema, model } = require("mongoose");

const customerSchema = new Schema({
  first_name: {
    type: String,
    required: true,
  },

  last_name: {
    type: String,
    default: "",
  },

  email: {
    type: String,
    default: "",
  },

  contact_no_1: {
    type: String,
    default: "",
  },

  contact_no_2: {
    type: String,
    default: "",
  },

  address_line_1: { type: String, default: "" },
  address_line_2: { type: String, default: "" },
  area: { type: String, default: "" },
  city: { type: String, default: "" },
  state: { type: String, default: "" },
  country: { type: String, default: "" },
  pincode: { type: String, default: "" },

  care_of: {
    type: String,
    default: "",
  },

  latest_measurements: {
    shoulder: { type: String, default: "" },
    arm_length: { type: String, default: "" },
    sleeves_length: { type: String, default: "" },
    armhole: { type: String, default: "" },
    biceps: { type: String, default: "" },
    neck_size: { type: String, default: "" },
    back_neck: { type: String, default: "" },
    upper_chest: { type: String, default: "" },
    chest: { type: String, default: "" },
    waist: { type: String, default: "" },
    waist_2: { type: String, default: "" },
    hip: { type: String, default: "" },
    top_length: { type: String, default: "" },
    tucks: { type: String, default: "" },

    pant_length: { type: String, default: "" },
    plazo_length: { type: String, default: "" },
    pyjama_length: { type: String, default: "" },
    salwar_length: { type: String, default: "" },
    round_up_1: { type: String, default: "" },
    round_up_2: { type: String, default: "" },
    round_up_3: { type: String, default: "" },
    main_round_up: { type: String, default: "" },

    aster: { type: String, default: "" },
    dupatta: { type: String, default: "" },
  },

  //  ADD THIS (MULTI-TENANT FIELD)
  storeId: {
    type: Schema.Types.ObjectId,
    ref: "Store",
    required: true,
  },

  createdOn: { type: Date, default: Date.now },
  updatedOn: { type: Date, default: Date.now },
});


// timestamps
customerSchema.pre("save", function (next) {
  this.updatedOn = new Date();
  if (!this.createdOn) this.createdOn = new Date();
  next();
});

customerSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update) {
    update.updatedOn = new Date();
  }
  next();
});

module.exports = model("Customer", customerSchema);