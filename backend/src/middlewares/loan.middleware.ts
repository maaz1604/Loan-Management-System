import type { NextFunction, Request, Response } from "express";

export const requireLoanStatus = (...allowedStatuses: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const status = (req.body?.status ?? req.params?.status ?? req.query?.status) as string | undefined;
    if (!status) {
      return res.status(400).json({ 
        message: "Loan status is required" 
    });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: `Loan status must be one of: ${allowedStatuses.join(", ")}`,
      });
    }

    return next();
  };
};

export const requireStatusTransition = (fromStatus: string, toStatus: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const currentStatus = (req.body?.currentStatus ?? req.body?.fromStatus) as string | undefined;
    const nextStatus = (req.body?.nextStatus ?? req.body?.toStatus) as string | undefined;

    if (currentStatus !== fromStatus || nextStatus !== toStatus) {
      return res.status(400).json({
        message: `Invalid transition. Expected ${fromStatus} -> ${toStatus}`,
      });
    }

    return next();
  };
};
