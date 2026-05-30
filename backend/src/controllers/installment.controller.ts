import type { Request, Response } from "express";
import Installment from "../models/Installment.js";
import { InstallmentService } from "../services/installment.service.js";
import mongoose from "mongoose";

export const InstallmentController = {
  generateSchedule: async (req: Request, res: Response) => {
    const loanId = req.params.loanId as string | undefined;

    if (!loanId) return res.status(400).json({ 
        message: "loanId is required" 
    });

    if (!mongoose.Types.ObjectId.isValid(loanId)){
        return res.status(400).json({ message: "Invalid loanId" });
    }

    const installments = await InstallmentService.generateSchedule(loanId);

    return res.status(201).json({ 
        message: "Installment schedule generated", installments 
    });
  },

  listByLoan: async (req: Request, res: Response) => {
    const loanId = req.params.loanId as string | undefined;

    if (!loanId){
        return res.status(400).json({ message: "loanId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(loanId)){
        return res.status(400).json({ message: "Invalid loanId" });
    }

    const installments = await Installment.find({ loanId }).sort({ installmentNumber: 1 });

    return res.status(200).json({ installments });
  },

  outstanding: async (req: Request, res: Response) => {
    const loanId = req.params.loanId as string | undefined;

    if (!loanId){
        return res.status(400).json({ message: "loanId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(loanId)){
        return res.status(400).json({ message: "Invalid loanId" });
    }

    const outstanding = await InstallmentService.getOutstandingForLoan(loanId);
    
    return res.status(200).json({ loanId, outstanding });
  },
};
