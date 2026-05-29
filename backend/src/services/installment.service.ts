import Installment from "../models/Installment.js";
import Loan from "../models/Loan.js";

export const InstallmentService = {
  generateSchedule: async (loanId: string) => {

    const loan = await Loan.findById(loanId);
    if (!loan) throw new Error('Loan not found');

    // simple schedule: number of installments = months approx (tenure days / 30)
    const count = Math.max(1, Math.ceil((loan.tenure || 0) / 30));
    const principal = loan.amount / count;
    const interestTotal = (loan.totalRepayment || 0) - (loan.amount || 0);
    const interestPer = interestTotal / count;
    const installments = [] as any[];

    const now = new Date();

    for (let i = 0; i < count; i++) {
      const due = new Date(now.getTime());
      due.setMonth(due.getMonth() + i + 1);
      const inst = {
        loanId: loan._id,
        installmentNumber: i + 1,
        dueDate: due,
        principalAmount: Math.round(principal),
        interestAmount: Math.round(interestPer),
        totalAmount: Math.round(principal + interestPer),
      };
      installments.push(inst);
    }
    await Installment.insertMany(installments);
    return installments;
  },

  getOutstandingForLoan: async (loanId: string) => {
    const installments = await Installment.find({ loanId });
    let outstanding = 0;

    for (const it of installments as any[]) {
      outstanding += ((it.totalAmount || 0) - (it.paidAmount || 0));
    }
    
    return outstanding;
  },
};
