const { Schema, model } = require("mongoose");

const invoiceDetailsSchema = new Schema(
  {
    invoice_id: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },

    order_id: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    description: {
      type: String,
      default: null,
    },

    quantity: {
      type: Number,
      default: 1,
    },

    extraWork: [
      {
        name: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
          default: 0,
        },
      },
    ],

    price: {
      type: Number,
      default: 0,
    },

    amount: {
      type: Number,
      required: true,
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
    timestamps: false,
  }
);


// 🔥 Auto timestamp
invoiceDetailsSchema.pre("save", function (next) {
  const now = new Date()
    .toISOString()
    .replace("T", " ")
    .substring(0, 19);

  if (!this.created_at) this.created_at = now;
  this.updated_at = now;
  next();
});

invoiceDetailsSchema.pre("findOneAndUpdate", function (next) {
  const now = new Date()
    .toISOString()
    .replace("T", " ")
    .substring(0, 19);

  this.set({ updated_at: now });
  next();
});

module.exports = model("InvoiceDetails", invoiceDetailsSchema);