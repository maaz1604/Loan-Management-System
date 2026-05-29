import mongoose from "mongoose";
import LoanModel from "../models/Loan.js";
import LoanHistory from "../models/LoanHistory.js";
import Payment from "../models/Payment.js";

export const calculateTotalRepayment = (amount: number,tenureDays: number,): number => {
  const interestRate = 12;
  const simpleInterest = (amount * interestRate * tenureDays) / (365 * 100);
  return Math.round(amount + simpleInterest);
};

export const createLoanFromApplication = async (data: any) => {
  const loan = await LoanModel.create(data);
  await LoanHistory.create({
    loanId: loan._id,
    changedBy: data.borrowerId,
    fromStatus: "PENDING",
    toStatus: loan.status,
    reason: "Created from application",
  });
  return loan;
};

export const sanctionLoan = async (loanId: string,byUserId: string,approve: boolean,reason?: string,) => {
  const session = await mongoose.startSession();

  try {

    //loan section
    let loan = await LoanModel.findById(loanId).session(session);
    if (!loan) throw new Error("Loan not found");

    // loan status section    
    const fromStatus = loan.status;
    loan.status = approve ? "SANCTIONED" : "REJECTED";
    if (!approve) {
        loan.rejectionReason = reason ?? null;
    }
    await loan.save({ session });
    await LoanHistory.create(
      [
        {
          loanId: loan._id,
          changedBy: byUserId,
          fromStatus,
          toStatus: loan.status,
          reason,
        },
      ],
      { session },
    );
    await session.commitTransaction();
    return loan;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

export const disburseLoan = async (
  loanId: string,
  byUserId: string,
  disbursedAt?: Date,
) => {
  const session = await mongoose.startSession();
  try {
    let loan = await LoanModel.findById(loanId).session(session);
    if (!loan) throw new Error("Loan not found");
    if (loan.status !== "SANCTIONED")
      throw new Error("Loan must be SANCTIONED before disbursal");
    const fromStatus = loan.status;
    loan.status = "DISBURSED";
    await loan.save({ session });
    await LoanHistory.create(
      [
        {
          loanId: loan._id,
          changedBy: byUserId,
          fromStatus,
          toStatus: loan.status,
          reason: "Funds released",
        },
      ],
      { session },
    );
    await session.commitTransaction();
    return loan;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

export const closeLoanIfFullyPaid = async (loanId: string,byUserId: string,) => {

  const loan = await LoanModel.findById(loanId);
  if (!loan) throw new Error("Loan not found");

  // compute paid from payments when PaymentService is used; caller should ensure consistency
  const paidAgg = await Payment.aggregate([
    { $match: { loanId: loan._id } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const totalPaid = (paidAgg[0] && paidAgg[0].total) || 0;
  
  if (totalPaid >= loan.totalRepayment && loan.status !== "CLOSED") {
    const fromStatus = loan.status;
    loan.status = "CLOSED";
    await loan.save();
    await LoanHistory.create({
      loanId: loan._id,
      changedBy: byUserId,
      fromStatus,
      toStatus: "CLOSED",
      reason: "Paid in full",
    });
    return loan;
  }
  return loan;
};
