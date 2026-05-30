import type { Request, Response } from "express";
import mongoose from "mongoose";
import Payment from "../models/Payment.js";
import { PaymentService } from "../services/payment.service.js";

export const PaymentController = {
  create: async (req: Request, res: Response) => {
    const loanId = req.body.loanId as string | undefined;
    const utrNumber = req.body.utrNumber as string | undefined;
    const amount = Number(req.body.amount);

    if (!loanId) {
      return res.status(400).json({ message: "loanId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(loanId)) {
      return res.status(400).json({ message: "Invalid loanId" });
    }

    if (!utrNumber) {
      return res.status(400).json({ message: "utrNumber is required" });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "amount must be a positive number" });
    }

    const paymentPayload: { loanId: string; utrNumber: string; amount: number; date?: Date } = {
      loanId,
      utrNumber,
      amount,
    };

    if (req.body.date) {
      paymentPayload.date = new Date(req.body.date);
    }

    const payment = await PaymentService.createPayment(paymentPayload, req.user?._id);

    return res.status(201).json({ message: "Payment recorded successfully", payment });
  },

  listByLoan: async (req: Request, res: Response) => {
    const loanId = req.params.loanId as string | undefined;

    if (!loanId) {
      return res.status(400).json({ message: "loanId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(loanId)) {
      return res.status(400).json({ message: "Invalid loanId" });
    }

    const payments = await Payment.find({ loanId }).sort({ date: -1 });

    return res.status(200).json({ payments });
  },

  getById: async (req: Request, res: Response) => {

    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    return res.status(200).json({ payment });
  },
};
