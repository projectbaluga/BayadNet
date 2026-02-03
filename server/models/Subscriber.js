const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    month: { type: String, required: true },
    paidAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const SubscriberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    rate: { type: Number, required: true },
    cycleDay: { type: Number, required: true },
    creditType: {
      type: String,
      enum: ["none", "two_weeks", "one_month"],
      default: "none"
    },
    creditAppliedMonth: { type: String, default: null },
    payments: { type: [PaymentSchema], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscriber", SubscriberSchema);
