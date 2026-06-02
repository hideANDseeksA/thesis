import express from "express"
import {
  upsertsystem_setting,
  getsystem_setting,
  deletesystem_setting,
} from "../controllers/system_setting.controller"

import { encryptFields } from "../middleware/encrypt.middleware"
import { decryptFields } from "../middleware/decrypt.middleware"
import { upload } from "../middleware/upload"
import { authenticate } from "../middleware/auth.middleware"
import { rbac } from "../middleware/rbac"
import { verifyApiKey } from "../middleware/apiKey.middleware"

const router = express.Router()

const SENSITIVE_FIELDS = ["web_name", "web_color", "barangay_status"]

router.use(verifyApiKey) // Apply API key verification to all routes in this router

router.post(
  "/",
  upload.single("logo"),
  encryptFields(SENSITIVE_FIELDS),
  authenticate,
  rbac("staff"),
  upsertsystem_setting
)


router.get("/", decryptFields(SENSITIVE_FIELDS), getsystem_setting)


router.delete("/",
  authenticate,
  rbac("staff"),
  deletesystem_setting)

export default router
