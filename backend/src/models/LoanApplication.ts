import mongoose from "mongoose";

const loanApplicationSchema = new mongoose.Schema(
  {
    borrowerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loan",
    },
    requestedAmount: {
      type: Number,
      required: true,
      min: 50000,
      max: 500000,
    },
    tenure: { type: Number, required: true, min: 30, max: 365 },
    salarySlipUrl: { type: String, required: true },
    employmentMode: {
      type: String,
      enum: ["Salaried", "Self-Employed", "Unemployed"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "LEAD",
        "APPLIED",
        "UNDER_REVIEW",
        "CONVERTED",
        "REJECTED",
        "WITHDRAWN",
      ],
      default: "LEAD",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rejectionReason: { type: String },
    notes: { type: String },
    convertedAt: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.model("LoanApplication", loanApplicationSchema);
