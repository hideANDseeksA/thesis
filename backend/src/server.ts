  import "module-alias/register";
  import express from "express";
  import cors from "cors";
  import dotenv from "dotenv";
  import cookieParser from "cookie-parser";
  import http from "http";



  //routes 

  import System_Setting from "./routes/system_settings.routes";
  import Purok from "./routes/purok.routes";
  import residentRoutes from "./routes/residents.routes";
  import authRoutes from "./routes/auth.routes";
  import certificatesRoutes from "./routes/certificates.routes";
  import transactionRoutes from "./routes/transaction.routes";
  import GeneratorRoute from "./routes/generator.route";
  import complaintsRoutes from "./routes/complaints.routes";
  import BlotterRoutes from "./routes/blotter.routes";
  import documentRoutes from "./routes/document.routes";
  import document_typesRoutes from "./routes/document_types.routes";
  import HealthRecordsRoutes from "./routes/health_records.routes";
  import PregnancyMonitoringRoutes from "./routes/pregnancy_monitoring.routes";
  import NotificationRoutes from "./routes/notification.routes";
  import AnalyticsRoutes from "./routes/analytics.routes";

  import { initSocket } from "./socket/index";

  import "./jobs/pregnancy.job";

  dotenv.config();

  const app = express();

  app.use(
    cors({
      origin: [
        "http://localhost:5173",
        "https://thesis-one-sage.vercel.app",
        "https://smart-barangay.forkforce.online",
        "http://192.168.1.41:5173"
      ],
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(cookieParser());

  const server = http.createServer(app);

  // Initialize Socket.IO
  initSocket(server);

  // Root route
  app.get("/", (_req, res) => {
    res.json({
      message: "Express + Prisma + TS 🚀",
    });
  });



  app.use("/api/system", System_Setting);
  app.use("/api/purok", Purok);
  app.use("/api/residents", residentRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/certificates", certificatesRoutes);
  app.use("/api/transactions", transactionRoutes);
  app.use("/api/generator", GeneratorRoute);
  app.use("/api/complaints", complaintsRoutes);
  app.use("/api/blotter", BlotterRoutes);
  app.use("/api/documents", documentRoutes);
  app.use("/api/document_types", document_typesRoutes);
  app.use("/api/health_records", HealthRecordsRoutes);
  app.use("/api/pregnancy-monitoring", PregnancyMonitoringRoutes);
  app.use("/api/notifications", NotificationRoutes);
  app.use("/api/analytics", AnalyticsRoutes);
  // Server Start
  const PORT = Number(process.env.PORT) || 3000;

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });