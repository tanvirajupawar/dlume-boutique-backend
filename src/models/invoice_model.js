const { Schema, model } = require("mongoose");

const invoiceSchema = new Schema(
  {
    invoice_number: {
      type: String,
    },

    client_id: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
    },

    invoice_date: {
      type: String,
      required: true,
    },

    order_id: {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },

    garments: [
      {
        type: Object,
      }
    ],

    total_amount: {
      type: Number,
      required: true,
    },

    discount: {
      type: Number,
      default: 0,
    },

    paid_amount: {
      type: Number,
      default: 0,
    },

    payment_status: {
      type: String,
      enum: ["Unpaid", "Paid", "Partially Paid"],
      default: "Unpaid",
    },

    notes: {
      type: String,
      default: null,
    },

    // 🔥 ADD THIS (MULTI-TENANT FIELD)
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },

    created_at: String,
    updated_at: String,
  },
  {
    timestamps: true,
  }
);


// 🔥 Pre-save middleware
invoiceSchema.pre("save", async function (next) {
  const now = new Date().toISOString().replace("T", " ").substring(0, 19);

  if (!this.created_at) this.created_at = now;
  this.updated_at = now;

  // 🔥 IMPORTANT: Generate invoice per store
  if (this.isNew && !this.invoice_number) {
    const last = await this.constructor
      .findOne({ storeId: this.storeId }) // 💥 KEY CHANGE
      .sort({ created_at: -1 })
      .select("invoice_number");

    let nextNumber = 1;

    if (last && last.invoice_number) {
      const match = last.invoice_number.match(/I-(\d+)/);
      if (match && match[1]) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    this.invoice_number = `I-${String(nextNumber).padStart(5, "0")}`;
  }

  next();
});


// 🔥 Update middleware
invoiceSchema.pre("findOneAndUpdate", function (next) {
  const now = new Date().toISOString().replace("T", " ").substring(0, 19);
  this.set({ updated_at: now });
  next();
});


const InvoiceModel = model("Invoice", invoiceSchema);
module.exports = InvoiceModel;