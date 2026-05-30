import type { NextFunction, Request, Response } from "express";

export const requireRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission to access this resource" });
    }

    return next();
  };
};

export const requireAdmin = requireRoles("Admin");
export const requireSales = requireRoles("Admin", "Sales");
export const requireSanction = requireRoles("Admin", "Sanction");
export const requireDisbursement = requireRoles("Admin", "Disbursement");
export const requireCollection = requireRoles("Admin", "Collection");
export const requireBorrower = requireRoles("Borrower", "Admin");
