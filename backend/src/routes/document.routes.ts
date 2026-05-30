import { Router } from "express";
import { DocumentController } from "../controllers/document.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { requireAdmin, requireSanction } from "../middlewares/role.middleware.js";
import { documentUpload } from "../middlewares/upload.middleware.js";

const router = Router();

router.post("/upload", authenticateToken, documentUpload, DocumentController.upload);
router.get("/loan/:loanId", authenticateToken, DocumentController.listByLoan);
router.get("/owner/:ownerId", authenticateToken, DocumentController.listByOwner);
router.patch("/:id/verify", authenticateToken, requireSanction, DocumentController.verify);

export default router;
