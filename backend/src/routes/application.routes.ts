import { Router } from "express";
import { ApplicationController } from "../controllers/application.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { requireSales } from "../middlewares/role.middleware.js";
import { salarySlipUpload } from "../middlewares/upload.middleware.js";

const router = Router();

router.post("/leads", authenticateToken, salarySlipUpload, ApplicationController.createLead);
router.patch("/:id/apply", authenticateToken, ApplicationController.apply);
router.patch("/:id/assign", authenticateToken, requireSales, ApplicationController.assignToSales);
router.patch("/:id/convert", authenticateToken, requireSales, ApplicationController.convertToLoan);

export default router;
