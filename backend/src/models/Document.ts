import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loan",
    },
    documentType: {
      type: String,
      enum: [
        "PAN",
        "AADHAAR",
        "SALARY_SLIP",
        "BANK_STATEMENT",
        "PHOTO",
        "ADDRESS_PROOF",
        "OTHER",
      ],
      required: true,
    },
    url: { type: String, required: true },
    originalName: { type: String },
    mimeType: { type: String },
    verified: { type: Boolean, default: false },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.model("Document", documentSchema);
