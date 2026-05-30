import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

type TokenPayload = jwt.JwtPayload & {
  id?: string;
  userId?: string;
  role?: string;
};

const getTokenFromRequest = (req: Request) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
};

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {

  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({
         message: "Authentication token is required"
        });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({
         message: "JWT_SECRET is not configured"
        });
    }

    const decoded = jwt.verify(token, secret) as TokenPayload;
    const userId = decoded.id || decoded.userId;
    if (!userId) {
      return res.status(401).json({
         message: "Invalid authentication token"
        });
    }

    const user = await User.findById(userId).select("_id role email name");
    if (!user) {
      return res.status(401).json({
         message: "User not found"
        });
    }

    req.user = {
      _id: String(user._id),
      role: user.role,
      email: user.email,
      name: user.name,
    };

    return next();
  } catch {
    return res.status(401).json({ 
        message: "Invalid or expired token"
    });
  }
};

export const optionalAuthenticateToken = async (req: Request, _res: Response, next: NextFunction) => {
  const token = getTokenFromRequest(req);
  
  if (!token) {
    return next();
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return next();
    }

    const decoded = jwt.verify(token, secret) as TokenPayload;
    const userId = decoded.id || decoded.userId;
    if (!userId) {
      return next();
    }

    const user = await User.findById(userId).select("_id role email name");
    if (!user) {
      return next();
    }

    req.user = {
      _id: String(user._id),
      role: user.role,
      email: user.email,
      name: user.name,
    };
  } catch (error) {
    // Ignore optional auth failures.
    void error;
  }

  return next();
};
