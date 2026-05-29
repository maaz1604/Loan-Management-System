import mongoose from "mongoose";

const loanHistorySchema = new mongoose.Schema(
  {
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loan",
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fromStatus: {
      type: String,
      enum: [
        "PENDING",
        "APPLIED",
        "SANCTIONED",
        "REJECTED",
        "DISBURSED",
        "CLOSED",
      ],
      required: true,
    },
    toStatus: {
      type: String,
      enum: [
        "PENDING",
        "APPLIED",
        "SANCTIONED",
        "REJECTED",
        "DISBURSED",
        "CLOSED",
      ],
      required: true,
    },
    reason: { type: String },
    remarks: { type: String },
    changedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default mongoose.model("LoanHistory", loanHistorySchema);
