import type { NextFunction, Request, Response } from "express";

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

export const asyncHandler = <T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<unknown>,) => {
  return (req: T, res: U, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const notFound = (_req: Request, res: Response) => {
  res.status(404).json({
     message: "Route not found"
    });
};

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
         message: err.message 
    });
  }

  if (err instanceof Error) {
    return res.status(500).json({ message: err.message });
  }

  return res.status(500).json({ message: "Internal server error" });
};
