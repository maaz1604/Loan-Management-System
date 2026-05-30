import type { Request, Response } from "express";
import Document from "../models/Document.js";
import mongoose from "mongoose";
import { DocumentService } from "../services/document.service.js";

const getUploadUrl = (req: Request) => {
  const file = req.file as Express.Multer.File | undefined;
  if (!file) {
    return null;
  }

  return `/uploads/documents/${file.filename}`;
};

export const DocumentController = {
  upload: async (req: Request, res: Response) => {
    const url = getUploadUrl(req) ?? req.body.url;
    if (!url) {
      return res.status(400).json({ message: "document file or url is required" });
    }

    const document = await DocumentService.upload({
      ownerId: req.body.ownerId ?? req.user?._id,
      loanId: req.body.loanId,
      documentType: req.body.documentType,
      url,
      originalName: req.file?.originalname,
      mimeType: req.file?.mimetype,
    });

    return res.status(201).json({
        message: "Document uploaded successfully",
        document 
    });
  },

  verify: async (req: Request, res: Response) => {
    const document = await DocumentService.verify(req.params.id as string, req.user!._id);
    return res.status(200).json({ message: "Document verified", document });
  },

  listByLoan: async (req: Request, res: Response) => {
    const loanId = req.params.loanId as string | undefined;

    if (!loanId){
        return res.status(400).json({ 
            message: "loanId is required" 
        });
    }

    if (!mongoose.Types.ObjectId.isValid(loanId)){
        return res.status(400).json({ 
            message: "Invalid loanId" 
        });
    }

    const documents = await Document.find({ loanId }).sort({ createdAt: -1 });

    return res.status(200).json({ documents });
  },

  listByOwner: async (req: Request, res: Response) => {
    const ownerId = req.params.ownerId as string | undefined;

    if (!ownerId){
        return res.status(400).json({ 
            message: "ownerId is required" 
        });
    }

    if (!mongoose.Types.ObjectId.isValid(ownerId)){
        return res.status(400).json({
            message: "Invalid ownerId" 
        });
    }

    const documents = await Document.find({ ownerId }).sort({ createdAt: -1 });

    return res.status(200).json({ 
        documents 
    });
  },
};