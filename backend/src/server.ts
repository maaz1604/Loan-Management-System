import express from "express";
import cors from "cors";
import path from "path";
import authRoutes from "./routes/auth.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import salesRoutes from "./routes/sales.routes.js";
import loanRoutes from "./routes/loan.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import installmentRoutes from "./routes/installment.routes.js";
import documentRoutes from "./routes/document.routes.js";
import { SalesController } from "./controllers/sales.controller.js";
import { authenticateToken } from "./middlewares/auth.middleware.js";
import { requireSales } from "./middlewares/role.middleware.js";
import { errorHandler, notFound } from "./middlewares/error.middleware.js";
import { connectDatabase, env } from "./config/index.js";

await connectDatabase();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/sales", salesRoutes);
app.get("/api/sales/leads", authenticateToken, requireSales, SalesController.listLeads);
app.use("/api/loans", loanRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/installments", installmentRoutes);
app.use("/api/documents", documentRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = env.port;

if (env.nodeEnv !== "test") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
