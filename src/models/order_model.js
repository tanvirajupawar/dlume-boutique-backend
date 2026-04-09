const mongoose = require("mongoose");
const { Schema, model, Types } = mongoose;

/* ================= GARMENT SCHEMA ================= */

const garmentSchema = new Schema(
{
  orderType: String,
  price: { type: Number, default: 0 },
  description: { type: String, default: "" },

  deliveryDate: {
    type: Date,
    set: (value) => {
      if (typeof value === "string" && value.includes("/")) {
        const [day, month, year] = value.split("/");
        return new Date(`${year}-${month}-${day}`);
      }
      return value;
    },
  },

  clothImage: String,

  designImage: {
    type: String,
    default: null,
  },

  designPaths: [
    {
      d: String,
      color: String,
      strokeWidth: Number,
    },
  ],

  designNotes: {
    type: String,
    default: "",
  },

  measurements: {
    shoulder: String,
    arm_length: String,
    sleeves_length: String,
    armhole: String,
    biceps: String,
    neck_size: String,
    back_neck: String,
    upper_chest: String,
    chest: String,
    waist: String,
    waist_2: String,
    hip: String,
    top_length: String,
    tucks: String,

    pant_length: String,
    plazo_length: String,
    pyjama_length: String,
    salwar_length: String,
    round_up_1: String,
    round_up_2: String,
    round_up_3: String,
    main_round_up: String,

    aster: String,
    dupatta: String,
  },

  extraWork: [
    {
      name: { type: String, required: true },
      amount: { type: Number, default: 0 },
    },
  ],

},
{ _id: false }
);

/* ================= ORDER SCHEMA ================= */

const orderSchema = new Schema({

  order_no: {
    type: String,
    index: true
  },

  order_date: {
    type: Date,
    default: Date.now,
  },

  assigned_master: {
    type: Types.ObjectId,
    ref: "Staff",
    default: null,
  },

  customer_id: { type: Types.ObjectId, ref: "Customer" },
  customer_name: String,
  contact_no_1: String,
  contact_no_2: String,
  care_of: { type: String, default: "" },

  staff_id: { type: Types.ObjectId, ref: "Staff" },

  garments: [garmentSchema],

  total: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },

  paid_amount: { type: Number, default: 0 },
  initial_advance: { type: Number, default: 0 },

  order_status: {
    type: String,
    enum: ["Pending", "In Progress", "Completed", "Approved", "Delivered"],
    default: "Pending",
  },

  payment_status: {
    type: String,
    enum: ["Unpaid", "Partially Paid", "Paid"],
    default: "Unpaid",
  },

  invoice: { type: Boolean, default: false },

  notes: String,
  design_notes: String,

  tasks: [
    {
      work_name: String,
      status: {
        type: String,
        enum: [
          "Pending",
          "Assigned",
          "In Progress",
          "Paused",
          "Completed",
          "Approved",
          "Disapproved",
        ],
        default: "Pending",
      },
    },
  ],

  // 🔥 ADD THIS (MULTI-TENANT FIELD)
  storeId: {
    type: Schema.Types.ObjectId,
    ref: "Store",
    required: true,
  },

  createdOn: { type: Date, default: Date.now },
  updatedOn: { type: Date, default: Date.now },
});


/* ================= VIRTUAL BALANCE ================= */

orderSchema.virtual("balance").get(function () {
  const total = this.total || 0;
  const paid = this.paid_amount || 0;
  return Math.max(0, total - paid);
});


/* ================= AUTO ORDER NUMBER ================= */

orderSchema.pre("save", async function (next) {
  try {
    const now = new Date();
    this.updatedOn = now;

    if (this.isNew && !this.order_no) {
      const lastOrder = await this.constructor
        .findOne({ 
          storeId: this.storeId,
          order_no: { $exists: true, $ne: null }  
        })
        .sort({ createdOn: -1 })
        .select("order_no")
        .lean();  

      let nextNumber = 1;

      if (lastOrder && lastOrder.order_no) {
        const match = lastOrder.order_no.match(/O-(\d+)/);
        if (match && match[1]) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }

      this.order_no = `O-${String(nextNumber).padStart(5, "0")}`;
    }

    next();
  } catch (err) {
    console.error("❌ pre-save order_no error:", err.message);
    next(err);  // passes error to controller's catch block
  }
});

/* ================= AUTO PAYMENT STATUS ================= */

orderSchema.pre("save", function (next) {
  const balance = (this.total || 0) - (this.paid_amount || 0);

  if (balance <= 0) {
    this.payment_status = "Paid";
  } else if (this.paid_amount > 0) {
    this.payment_status = "Partially Paid";
  } else {
    this.payment_status = "Unpaid";
  }

  next();
});


orderSchema.set("toJSON", { virtuals: true });
orderSchema.set("toObject", { virtuals: true });

module.exports = model("Order", orderSchema);