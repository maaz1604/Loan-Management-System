import LoanApplication from "../models/LoanApplication.js";
import Loan from "../models/Loan.js";
import { createLoanFromApplication, calculateTotalRepayment } from "./loan.service.js";

export const ApplicationService = {
  createLead: async (payload: any) => {
    return LoanApplication.create(payload);
  },

  apply: async (applicationId: string) => {
    const app = await LoanApplication.findById(applicationId);
    if (!app) throw new Error('Application not found');
    app.status = 'APPLIED';
    await app.save();
    return app;
  },

  assignToSales: async (applicationId: string, salesUserId: string) => {
    const app = await LoanApplication.findById(applicationId);
    if (!app) throw new Error('Application not found');
    app.assignedTo = salesUserId as any;
    await app.save();
    return app;
  },

  convertToLoan: async (applicationId: string) => {
    const app = await LoanApplication.findById(applicationId);
    if (!app) throw new Error('Application not found');
    if (app.status !== 'APPLIED' && app.status !== 'UNDER_REVIEW') throw new Error('Application not ready for conversion');
    const totalRepayment = calculateTotalRepayment(app.requestedAmount, app.tenure);
    const loanData: any = {
      borrowerId: app.borrowerId,
      salarySlipUrl: app.salarySlipUrl,
      amount: app.requestedAmount,
      tenure: app.tenure,
      totalRepayment,
      status: 'SANCTIONED',
    };
    const loan = await createLoanFromApplication(loanData);
    app.loanId = loan._id;
    app.status = 'CONVERTED';
    app.convertedAt = new Date();
    await app.save();
    return loan;
  },

  sanctionDecision: async (applicationId: string, sanctionUserId: string, approve: boolean, reason: string) => {
    const app = await LoanApplication.findById(applicationId);
    if (!app) throw new Error('Application not found');
    if (app.status !== 'APPLIED' && app.status !== 'UNDER_REVIEW') throw new Error('Only applied applications can be sanctioned');

    const trimmedReason = reason.trim();
    if (!trimmedReason) throw new Error('Reason is required');

    app.assignedTo = sanctionUserId as any;

    if (!approve) {
      app.status = 'REJECTED';
      app.rejectionReason = trimmedReason;
      app.notes = trimmedReason;
      await app.save();
      return { application: app, loan: null };
    }

    app.status = 'UNDER_REVIEW';
    app.notes = trimmedReason;
    await app.save();

    const loan = await ApplicationService.convertToLoan(applicationId);
    const refreshed = await LoanApplication.findById(applicationId);

    return { application: refreshed ?? app, loan };
  },
};
