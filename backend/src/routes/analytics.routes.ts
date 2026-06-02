    

import express from "express";
import {  getWebsite, getWebsiteActive, getWebsiteStats,getDashboardStats,getDashboardTotals } from "../controllers/analytics.controller";
import { verifyApiKey } from "../middleware/apiKey.middleware";
import { authenticate } from "../middleware/auth.middleware";
import { rbac } from "../middleware/rbac";

const router = express.Router();

router.use(verifyApiKey);

router.get("/website",                  getWebsite);
router.get("/website/active",    getWebsiteActive);
router.get("/website/stats",     getWebsiteStats);
router.get("/dashboard/stats",
        authenticate,
        rbac("healthworker", "staff"),
       getDashboardStats);
router.get("/dashboard/totals",
      authenticate,
      rbac("healthworker", "staff"),
      getDashboardTotals);


export default router;