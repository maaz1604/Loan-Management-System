import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { env, disconnectDatabase } from "../config/index.js";

import User from "../models/User.js";
import LoanApplication from "../models/LoanApplication.js";
import Loan from "../models/Loan.js";
import Payment from "../models/Payment.js";
import Installment from "../models/Installment.js";
import Document from "../models/Document.js";
import LoanHistory from "../models/LoanHistory.js";

import { ApplicationService } from "../services/application.service.js";
import { sanctionLoan, disburseLoan } from "../services/loan.service.js";
import { InstallmentService } from "../services/installment.service.js";
import { PaymentService } from "../services/payment.service.js";
import { DocumentService } from "../services/document.service.js";

type SeedRole = "Admin" | "Sales" | "Sanction" | "Disbursement" | "Collection" | "Borrower";

const roles: SeedRole[] = ["Admin", "Sales", "Sanction", "Disbursement", "Collection", "Borrower"];

const basePassword = "password123";

const clearDatabase = async () => {
  await Promise.all([
    User.deleteMany({}),
    LoanApplication.deleteMany({}),
    Loan.deleteMany({}),
    Payment.deleteMany({}),
    Installment.deleteMany({}),
    Document.deleteMany({}),
    LoanHistory.deleteMany({}),
  ]);
};

const createRoleUser = async (role: SeedRole) => {
  const hashedPassword = await bcrypt.hash(basePassword, 10);
  const userData: any = {
    name: `${role} User`,
    email: `${role.toLowerCase()}@lms.com`,
    password: hashedPassword,
    role,
    ...(role === "Borrower" && {
      pan: "ABCPA1234Z",
      dob: new Date("1990-01-01"),
      monthlySalary: 50000,
      employmentMode: "Salaried",
    }),
  };

  return User.create(userData);
};

const seedDatabase = async () => {
  await mongoose.connect(env.mongoUri);
  console.log("Connected to DB. Resetting seed data...");

  try {
    await clearDatabase();

    const users = (await Promise.all(roles.map((role) => createRoleUser(role)))) as any[];

    const admin = users.find((user) => user.role === "Admin")!;
    const sales = users.find((user) => user.role === "Sales")!;
    const sanction = users.find((user) => user.role === "Sanction")!;
    const disbursement = users.find((user) => user.role === "Disbursement")!;
    const collection = users.find((user) => user.role === "Collection")!;
    const borrower = users.find((user) => user.role === "Borrower")!;

    const lead = await ApplicationService.createLead({
      borrowerId: borrower._id,
      requestedAmount: 250000,
      tenure: 180,
      salarySlipUrl: "/uploads/salary-slips/seed-salary-slip.pdf",
      employmentMode: "Salaried",
      notes: "Seeded borrower lead for LMS workflow testing",
    });

    await ApplicationService.assignToSales(String(lead._id), String(sales._id));
    await ApplicationService.apply(String(lead._id));

    const loan = await ApplicationService.convertToLoan(String(lead._id));
    await sanctionLoan(String(loan._id), String(sanction._id), true, "Eligible as per BRE");

    await InstallmentService.generateSchedule(String(loan._id));

    await disburseLoan(String(loan._id), String(disbursement._id));

    const partialPaymentAmount = 10000;
    await PaymentService.createPayment(
      {
        loanId: String(loan._id),
        utrNumber: "UTR-SEED-0001",
        amount: partialPaymentAmount,
        date: new Date(),
      },
      String(collection._id),
    );

    const firstInstallment = await Installment.findOne({ loanId: loan._id }).sort({ installmentNumber: 1 });
    if (firstInstallment) {
      firstInstallment.paidAmount = partialPaymentAmount;
      firstInstallment.status = partialPaymentAmount >= firstInstallment.totalAmount ? "PAID" : "PARTIAL";
      firstInstallment.paidAt = new Date();
      await firstInstallment.save();
    }

    const salarySlipDocument = await DocumentService.upload({
      ownerId: String(borrower._id),
      loanId: String(loan._id),
      documentType: "SALARY_SLIP",
      url: "/uploads/documents/seed-salary-slip.pdf",
      originalName: "seed-salary-slip.pdf",
      mimeType: "application/pdf",
    });

    await DocumentService.upload({
      ownerId: String(borrower._id),
      loanId: String(loan._id),
      documentType: "PAN",
      url: "/uploads/documents/seed-pan-card.pdf",
      originalName: "seed-pan-card.pdf",
      mimeType: "application/pdf",
    });

    await DocumentService.verify(String(salarySlipDocument._id), String(admin._id));

    const summary = {
      usersCreated: users.length,
      leadId: String(lead._id),
      loanId: String(loan._id),
      paymentSeeded: true,
      documentsSeeded: 2,
    };

    console.log("Seeding complete.");
    console.log(summary);
  } finally {
    await disconnectDatabase();
  }
};

seedDatabase().catch((error) => {
  console.error("Seeding failed:", error);
  process.exitCode = 1;
});