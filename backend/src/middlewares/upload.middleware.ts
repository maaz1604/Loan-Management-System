import fs from "fs";
import path from "path";
import multer from "multer";

const uploadsRoot = path.join(process.cwd(), "uploads");
const docDir = path.join(uploadsRoot, "documents");
const slipDir = path.join(uploadsRoot, "salary-slips");

for (const dir of [uploadsRoot, docDir, slipDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const createStorage = (destination: string) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, destination),
    filename: (_req, file, cb) => {
      const safeName = file.originalname.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`);
    },
  });

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    return cb(new Error("Unsupported file type"));
  }
  return cb(null, true);
};

const createUploader = (destination: string) =>
  multer({
    storage: createStorage(destination),
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 },
  });

export const salarySlipUpload = createUploader(slipDir).single("salarySlip");
export const documentUpload = createUploader(docDir).single("document");
export const multipleDocumentUpload = createUploader(docDir).array("documents", 10);

export const loanAttachmentUpload = createUploader(docDir).fields([
  { name: "salarySlip", maxCount: 1 },
  { name: "document", maxCount: 1 },
  { name: "documents", maxCount: 10 },
]);
