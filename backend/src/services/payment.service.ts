import mongoose from "mongoose";
import Payment from "../models/Payment.js";
import Loan from "../models/Loan.js";
import { closeLoanIfFullyPaid } from "./loan.service.js";

export const PaymentService = {
  createPayment: async (
    payload: { loanId: string; utrNumber: string; amount: number; date?: Date },
    byUserId?: string,
  ) => {

    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const { loanId, utrNumber, amount, date } = payload;

      if (amount <= 0) throw new Error("Payment amount must be positive");

      const utrExists = await Payment.findOne({ utrNumber }).session(session);

      if (utrExists) throw new Error("UTR already exists");


      const loan = await Loan.findById(loanId).session(session);
      if (!loan) throw new Error("Loan not found");
      if (loan.status !== "DISBURSED"){
        throw new Error("Payments can only be recorded for DISBURSED loans");
      }

      // compute outstanding
      const paidAgg = await Payment.aggregate([
        { $match: { loanId: loan._id } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]).session(session);

      const totalPaid = (paidAgg[0] && paidAgg[0].total) || 0;
      const outstanding = loan.totalRepayment - totalPaid;
      
      if (amount > outstanding)
        throw new Error("Payment exceeds outstanding amount");

      const payment = await Payment.create(
        [{ loanId, utrNumber, amount, date }],
        { session },
      );

      await session.commitTransaction();
      session.endSession();

      // Post-commit: check for closure
      await closeLoanIfFullyPaid(loanId, byUserId || (loan.borrowerId as any));
      return payment[0];
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  },
};
