import { Router } from "express";
import { SalesController } from "../controllers/sales.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { requireSales } from "../middlewares/role.middleware.js";

const router = Router();

router.get("/leads", authenticateToken, requireSales, SalesController.listLeads);

export default router;