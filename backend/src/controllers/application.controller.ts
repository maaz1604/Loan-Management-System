import type { Request, Response } from "express";
import LoanApplication from "../models/LoanApplication.js";
import { ApplicationService } from "../services/application.service.js";
import { runBusinessRuleEngine } from "../services/bre.service.js";
import User from "../models/User.js";

const getSalarySlipUrl = (req: Request) => {
  const file = req.file as Express.Multer.File | undefined;
  if (file) {
    return `/uploads/salary-slips/${file.filename}`;
  }

  const bodyUrl = req.body?.salarySlipUrl;
  if (typeof bodyUrl === "string" && bodyUrl.trim()) {
    return bodyUrl.trim();
  }

  return null;
};

export const ApplicationController = {
  createLead: async (req: Request, res: Response) => {
    const borrowerId = req.user?._id ?? req.body.borrowerId;
    const salarySlipUrl = getSalarySlipUrl(req);

    if (!borrowerId) {
      return res.status(400).json({ message: "borrowerId is required" });
    }

    if (!salarySlipUrl) {
      return res.status(400).json({ message: "salary slip is required" });
    }

    const payload = {
      borrowerId,
      requestedAmount: req.body.requestedAmount,
      tenure: req.body.tenure,
      salarySlipUrl,
      employmentMode: req.body.employmentMode,
      notes: req.body.notes,
    };

    const application = await ApplicationService.createLead(payload);
    return res.status(201).json({ message: "Lead created successfully", application });
  },

  apply: async (req: Request, res: Response) => {
    const applicationId = req.params.id as string;
    const application = await ApplicationService.apply(applicationId);
    return res.status(200).json({ message: "Application submitted", application });
  },

  assignToSales: async (req: Request, res: Response) => {
    const application = await ApplicationService.assignToSales(req.params.id as string, req.body.salesUserId as string);
    return res.status(200).json({ message: "Application assigned to sales", application });
  },

  convertToLoan: async (req: Request, res: Response) => {
    const applicationId = req.params.id as string;
    const application = await LoanApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // If authenticated, load full borrower profile for BRE checks
    let borrowerProfile = null as null | any;
    if (req.user?._id) {
      borrowerProfile = await User.findById(req.user._id).select("dob monthlySalary pan employmentMode");
    }

    const breResult = runBusinessRuleEngine({
      dob: req.body.dob ?? borrowerProfile?.dob,
      monthlySalary: req.body.monthlySalary ?? borrowerProfile?.monthlySalary,
      pan: req.body.pan ?? borrowerProfile?.pan,
      employmentMode: req.body.employmentMode ?? borrowerProfile?.employmentMode,
    });

    if (!breResult.passed) {
      return res.status(400).json({ 
        message: breResult.reason 
    });
    }

    const loan = await ApplicationService.convertToLoan(applicationId);
    return res.status(201).json({ message: "Application converted to loan", loan });
  },
};
