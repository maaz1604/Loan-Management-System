import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: [
        "Admin",
        "Sales",
        "Sanction",
        "Disbursement",
        "Collection",
        "Borrower",
      ],
      default: "Borrower",
    },
    // Borrower specific fields
    pan: { type: String },
    dob: { type: Date },
    monthlySalary: { type: Number },
    employmentMode: {
      type: String,
      enum: ["Salaried", "Self-Employed", "Unemployed"],
    },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
