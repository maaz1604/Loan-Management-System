import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const buildToken = (user: { _id: unknown; role: string }) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign({ id: String(user._id), role: user.role }, secret, {
    expiresIn: "1d",
  });
};

export const AuthController = {
  register: async (req: Request, res: Response) => {
    const { name, email, password, role, pan, dob, monthlySalary, employmentMode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
         message: "name, email and password are required"
        });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
         message: "Email already registered"
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      pan,
      dob,
      monthlySalary,
      employmentMode,
    });

    const token = buildToken(user);

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  },

  login: async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = buildToken(user);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  },

  me: async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await User.findById(req.user._id).select("_id name email role pan dob monthlySalary employmentMode createdAt updatedAt");
    if (!user) {
      return res.status(404).json({ 
        message: "User not found" 
    });
    }

    return res.status(200).json({
         user 
        });
  },
};
