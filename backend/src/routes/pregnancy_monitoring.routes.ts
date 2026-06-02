import express from "express"
import {
  createPregnancy_monitoring,
  getPregnancy_monitoring,
  getPregnancy_monitoringById,
  updatePregnancy_monitoring,
  deletePregnancy_monitoring,
  getMissedVisits,
  patchPregnancyMonitoringStatus
    } from "../controllers/pregnancy_monitoring.controller"
import { decryptFields } from "../middleware/decrypt.middleware"
import { encryptFields } from "../middleware/encrypt.middleware"
import { authenticate } from "../middleware/auth.middleware"
import { rbac } from "../middleware/rbac"

const router = express.Router()
const SENSITIVE_FIELDS =["details"]

router.post("/", encryptFields(SENSITIVE_FIELDS), authenticate, rbac("healthworker"), createPregnancy_monitoring)

router.get("/", decryptFields(SENSITIVE_FIELDS), authenticate, rbac("healthworker"), getPregnancy_monitoring)

router.get("/missed", decryptFields(SENSITIVE_FIELDS), authenticate, rbac("healthworker"), getMissedVisits)

router.get("/:id", decryptFields(SENSITIVE_FIELDS), authenticate, rbac("healthworker"), getPregnancy_monitoringById)


router.put("/:id", encryptFields(SENSITIVE_FIELDS), authenticate, rbac("healthworker"), updatePregnancy_monitoring)


router.delete("/:id", authenticate, rbac("healthworker"), deletePregnancy_monitoring)

router.patch("/:id/status", authenticate, rbac("healthworker"), patchPregnancyMonitoringStatus)
export default router
