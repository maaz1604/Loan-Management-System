import mongoose from "mongoose";

const installmentSchema = new mongoose.Schema(
  {
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loan",
      required: true,
    },
    installmentNumber: { type: Number, required: true, min: 1 },
    dueDate: { type: Date, required: true },
    principalAmount: { type: Number, required: true, min: 0 },
    interestAmount: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["PENDING", "PARTIAL", "PAID", "OVERDUE"],
      default: "PENDING",
    },
    paidAt: { type: Date },
  },
  { timestamps: true },
);

installmentSchema.index({ loanId: 1, installmentNumber: 1 }, { unique: true });

export default mongoose.model("Installment", installmentSchema);
