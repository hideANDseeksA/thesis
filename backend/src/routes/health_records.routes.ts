import express from "express"
import {
    createHealth_record,
    getHealth_records,
    getHealth_recordById,
    getHealth_recordsByResidentId,
    updateHealth_record,
    deleteHealth_record,
} from "../controllers/health_records.controller"
import { encryptFields } from "../middleware/encrypt.middleware"
import { decryptFields } from "../middleware/decrypt.middleware"
import { authenticate } from "../middleware/auth.middleware"
import { rbac } from "../middleware/rbac"

const router = express.Router()
const SENSITIVE_FIELDS = ["details"];

router.post("/", 
  encryptFields(SENSITIVE_FIELDS), 
  authenticate,
  rbac("healthworker"),
  createHealth_record)


router.get("/", 
    decryptFields(SENSITIVE_FIELDS),
    authenticate,
    rbac("healthworker"),
    getHealth_records)


router.get("/:record_id", decryptFields(SENSITIVE_FIELDS), authenticate, rbac("healthworker"), getHealth_recordById)


router.get("/pregnant/:record_id", decryptFields(SENSITIVE_FIELDS), authenticate, rbac("healthworker"), getHealth_recordsByResidentId)


router.put("/:id", encryptFields(SENSITIVE_FIELDS), authenticate, rbac("healthworker"), updateHealth_record)


router.delete("/:id", authenticate, rbac("healthworker"), deleteHealth_record)

export default router
