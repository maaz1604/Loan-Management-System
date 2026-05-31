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

const buildSalesLeads = async () => {
  const applicationBorrowerIds = await LoanApplication.distinct("borrowerId");

  const leads = await User.find({
    role: "Borrower",
    _id: { $nin: applicationBorrowerIds },
  })
    .select("_id name email createdAt updatedAt pan dob monthlySalary employmentMode")
    .sort({ createdAt: -1 });

  return leads.map((lead) => ({
    ...lead.toObject(),
    status: "LEAD" as const,
    applicationCount: 0,
  }));
};

export const ApplicationController = {
  listLeads: async (_req: Request, res: Response) => {
    const leads = await buildSalesLeads();
    return res.status(200).json({ leads });
  },

  list: async (req: Request, res: Response) => {
    const view = new URL(req.originalUrl, "http://localhost").searchParams.get("view");
    if (view === "sales-leads") {
      const leads = await buildSalesLeads();
      return res.status(200).json({ leads });
    }

    const applications = await LoanApplication.find()
      .populate("borrowerId", "_id name email role")
      .sort({ createdAt: -1 });
    return res.status(200).json({ applications });
  },

  mine: async (req: Request, res: Response) => {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const applications = await LoanApplication.find({ borrowerId: req.user._id })
      .populate("borrowerId", "_id name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({ applications });
  },

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

  sanction: async (req: Request, res: Response) => {
    const { approve, reason } = req.body;
    const reasonText = typeof reason === "string" ? reason : "";

    if (!reasonText.trim()) {
      return res.status(400).json({ message: "Reason is required" });
    }

    const result = await ApplicationService.sanctionDecision(
      req.params.id as string,
      req.user!._id,
      Boolean(approve),
      reasonText,
    );

    return res.status(200).json({
      message: Boolean(approve) ? "Application approved" : "Application rejected",
      application: result.application,
      loan: result.loan,
    });
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
