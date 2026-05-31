import { Router } from "express";
import { LoanController } from "../controllers/loan.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { requireSanction, requireDisbursement } from "../middlewares/role.middleware.js";

const router = Router();

router.get("/", authenticateToken, LoanController.list);
router.get("/mine", authenticateToken, LoanController.mine);
router.post("/", authenticateToken, LoanController.create);
router.get("/:id", authenticateToken, LoanController.getById);
router.patch("/:id/sanction", authenticateToken, requireSanction, LoanController.sanction);
router.patch("/:id/disburse", authenticateToken, requireDisbursement, LoanController.disburse);
router.patch("/:id/close", authenticateToken, LoanController.closeIfPaid);

export default router;
