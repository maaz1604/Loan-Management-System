import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { requireCollection } from "../middlewares/role.middleware.js";

const router = Router();

router.post("/", authenticateToken, requireCollection, PaymentController.create);
router.get("/loan/:loanId", authenticateToken, PaymentController.listByLoan);
router.get("/:id", authenticateToken, PaymentController.getById);

export default router;
