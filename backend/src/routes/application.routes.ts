import { Router } from "express";
import { ApplicationController } from "../controllers/application.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { requireRoles, requireSales, requireSanction } from "../middlewares/role.middleware.js";
import { salarySlipUpload } from "../middlewares/upload.middleware.js";

const router = Router();

router.get("/leads", authenticateToken, requireSales, ApplicationController.listLeads);
router.get("/mine", authenticateToken, ApplicationController.mine);
router.get("/", authenticateToken, requireRoles("Admin", "Sales", "Sanction"), ApplicationController.list);
router.post("/leads", authenticateToken, salarySlipUpload, ApplicationController.createLead);
router.patch("/:id/apply", authenticateToken, ApplicationController.apply);
router.patch("/:id/assign", authenticateToken, requireSales, ApplicationController.assignToSales);
router.patch("/:id/sanction", authenticateToken, requireSanction, ApplicationController.sanction);
router.patch("/:id/convert", authenticateToken, requireSales, ApplicationController.convertToLoan);

export default router;
