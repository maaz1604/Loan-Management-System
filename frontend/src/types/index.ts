export type Role = 'Admin' | 'Sales' | 'Sanction' | 'Disbursement' | 'Collection' | 'Borrower';

export type EmploymentMode = 'Salaried' | 'Self-Employed' | 'Unemployed';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  pan?: string;
  dob?: string;
  monthlySalary?: number;
  employmentMode?: EmploymentMode;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoanApplication {
  _id: string;
  borrowerId: string | User;
  loanId?: string | Loan;
  requestedAmount: number;
  tenure: number;
  salarySlipUrl: string;
  employmentMode: EmploymentMode;
  status: 'LEAD' | 'APPLIED' | 'UNDER_REVIEW' | 'CONVERTED' | 'REJECTED' | 'WITHDRAWN';
  assignedTo?: string | User;
  rejectionReason?: string;
  notes?: string;
  convertedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalesLead extends User {
  status: 'LEAD';
  applicationCount: number;
}

export interface Loan {
  _id: string;
  borrowerId: string | User;
  salarySlipUrl: string;
  amount: number;
  tenure: number;
  interestRate: number;
  totalRepayment: number;
  status: 'PENDING' | 'APPLIED' | 'SANCTIONED' | 'REJECTED' | 'DISBURSED' | 'CLOSED';
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Payment {
  _id: string;
  loanId: string;
  utrNumber: string;
  amount: number;
  date: string;
  createdAt?: string;
}

export interface Installment {
  _id: string;
  loanId: string;
  installmentNumber: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  paidAt?: string;
}

export interface Document {
  _id: string;
  ownerId: string;
  loanId?: string;
  documentType: 'PAN' | 'AADHAAR' | 'SALARY_SLIP' | 'BANK_STATEMENT' | 'PHOTO' | 'ADDRESS_PROOF' | 'OTHER';
  url: string;
  originalName?: string;
  mimeType?: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface ApiError {
  message: string;
  status?: number;
}
