import { Router } from "express";
import { InstallmentController } from "../controllers/installment.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { requireCollection, requireSanction } from "../middlewares/role.middleware.js";

const router = Router();

router.post("/loan/:loanId/generate", authenticateToken, requireSanction, InstallmentController.generateSchedule);
router.get("/loan/:loanId", authenticateToken, InstallmentController.listByLoan);
router.get("/loan/:loanId/outstanding", authenticateToken, requireCollection, InstallmentController.outstanding);

export default router;
