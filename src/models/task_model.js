const mongoose = require("mongoose");
const { Schema, model, Types } = mongoose;

const taskSchema = new Schema(
  {
    order_id: { type: Types.ObjectId, ref: "Order", required: true },

    garment_index: {
      type: Number,
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    assigned_staff_1: { type: Types.ObjectId, ref: "Staff" },
    assigned_staff_2: { type: Types.ObjectId, ref: "Staff" },
    assigned_staff_3: { type: Types.ObjectId, ref: "Staff" },

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

    start_date: Date,
    end_date: Date,

    amount: {
      type: Number,
      default: 0.0,
    },

    paid_amount: {
      type: Number,
      default: 0,
    },

    remarks: {
      type: String,
      default: "",
    },

    completed_by: {
      type: Types.ObjectId,
      ref: "Staff",
    },

    // 🔥 ADD THIS (MULTI-TENANT FIELD)
    storeId: {
      type: Types.ObjectId,
      ref: "Store",
      required: true,
    },

    createdOn: { type: Date, default: Date.now },
    updatedOn: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);


// Pre-save hook
taskSchema.pre("save", function (next) {
  this.updatedOn = new Date();
  if (!this.createdOn) this.createdOn = new Date();
  next();
});


// Pre-update hook
taskSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update._id) delete update._id;
  update.updatedOn = new Date();
  next();
});


const TaskModel = model("Task", taskSchema);
module.exports = TaskModel;