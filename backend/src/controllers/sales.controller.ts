import type { Request, Response } from "express";
import LoanApplication from "../models/LoanApplication.js";
import User from "../models/User.js";

export const SalesController = {
  listLeads: async (_req: Request, res: Response) => {
    const applicationBorrowerIds = await LoanApplication.distinct("borrowerId");

    const leads = await User.find({
      role: "Borrower",
      _id: { $nin: applicationBorrowerIds },
    })
      .select("_id name email createdAt updatedAt pan dob monthlySalary employmentMode")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      leads: leads.map((lead) => ({
        ...lead.toObject(),
        status: "LEAD" as const,
        applicationCount: 0,
      })),
    });
  },
};