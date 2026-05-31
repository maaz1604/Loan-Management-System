import type { Request, Response } from "express";
import Loan from "../models/Loan.js";
import { calculateTotalRepayment, sanctionLoan, disburseLoan, closeLoanIfFullyPaid } from "../services/loan.service.js";

const loanWithBorrower = () => Loan.find().populate("borrowerId", "_id name email role");

export const LoanController = {
  create: async (req: Request, res: Response) => {
    const { borrowerId, amount, tenure, salarySlipUrl } = req.body;

    if (!borrowerId || !amount || !tenure || !salarySlipUrl) {

      return res.status(400).json({
        message: "borrowerId, amount, tenure and salarySlipUrl are required" 
      });

    }

    const totalRepayment = calculateTotalRepayment(Number(amount), Number(tenure));

    const loan = await Loan.create({
      borrowerId,
      amount,
      tenure,
      salarySlipUrl,
      totalRepayment,
    });

    return res.status(201).json({ 
        message: "Loan created successfully", loan: await Loan.findById(loan._id).populate("borrowerId", "_id name email role") 
    });
  },

  list: async (_req: Request, res: Response) => {
    const loans = await Loan.find().populate("borrowerId", "_id name email role").sort({ createdAt: -1 });
    return res.status(200).json({ loans });
  },

  mine: async (req: Request, res: Response) => {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const loans = await Loan.find({ borrowerId: req.user._id })
      .populate("borrowerId", "_id name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({ loans });
  },

  getById: async (req: Request, res: Response) => {
    const loan = await Loan.findById(req.params.id).populate("borrowerId", "_id name email role");

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    return res.status(200).json({ loan });
  },

  sanction: async (req: Request, res: Response) => {
    const { approve, reason } = req.body;
    const loan = await sanctionLoan(req.params.id as string, req.user!._id, Boolean(approve), reason);

    return res.status(200).json({ 
        message: "Loan status updated", loan 
    });
  },

  disburse: async (req: Request, res: Response) => {
    const loan = await disburseLoan(
      req.params.id as string, 
      req.user!._id, 
      req.body.disbursedAt ? new Date(req.body.disbursedAt) : undefined,
      req.body.reason
    );

    return res.status(200).json({ 
        message: "Loan disbursed", loan 
    });
  },

  closeIfPaid: async (req: Request, res: Response) => {
    const loan = await closeLoanIfFullyPaid(req.params.id as string, req.user!._id);

    return res.status(200).json({ 
        message: "Loan checked for closure", loan 
    });
  },
};
