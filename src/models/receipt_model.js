const { Schema, model, Types } = require("mongoose");

const receiptSchema = new Schema(
  {
    receipt_no: {
      type: String,
    },

    receipt_date: {
      type: Date,
      default: Date.now,
    },

    // ================= LINKED ORDERS =================
    orders: [
      {
        order_id: {
          type: Types.ObjectId,
          ref: "Order",
          required: true,
        },
        applied_amount: {
          type: Number,
          required: true,
        },
      },
    ],

    total_amount: {
      type: Number,
      required: true,
    },

    payment_mode: {
      type: String,
      enum: ["Cash", "Card", "Cheque", "Bank Transfer", "UPI", "Other"],
      required: true,
    },

    // ================= OPTIONAL DETAILS =================
    transaction_no: String,
    card_no: String,
    bank_name: String,
    account_no: String,
    cheque_no: String,

    // ================= AUDIT =================
    created_by: {
      type: Types.ObjectId,
      ref: "User",
    },

    notes: String,

    // 🔥 ADD THIS (MULTI-TENANT FIELD)
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);


/* ================= AUTO RECEIPT NUMBER ================= */

receiptSchema.pre("save", async function (next) {
  if (this.isNew && !this.receipt_no) {
    const last = await this.constructor
      .findOne({ storeId: this.storeId }) // 💥 KEY CHANGE
      .sort({ _id: -1 })
      .select("receipt_no");

    let nextNumber = 1;

    if (last && last.receipt_no) {
      const match = last.receipt_no.match(/R(\d+)/);
      if (match && match[1]) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    this.receipt_no = `R${String(nextNumber).padStart(6, "0")}`;
  }

  next();
});


module.exports = model("Receipt", receiptSchema);