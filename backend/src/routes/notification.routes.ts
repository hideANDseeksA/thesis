import {getNotificationsByRole, createNotification,getNotificationsByResidentId, updateNotification, deleteNotification} from '../controllers/notification.controller'
import express from 'express'
import { encryptFields } from '../middleware/encrypt.middleware'
import { decryptFields } from '../middleware/decrypt.middleware'
import { authenticate } from '../middleware/auth.middleware'
import { rbac } from '../middleware/rbac'
const router = express.Router()
const SENSITIVE_FIELDS = ["content"];


router.post("/", 
    encryptFields(SENSITIVE_FIELDS),
    authenticate,
    rbac("staff", "healthworker","resident"),
     createNotification)
router.get("/resident/:resident_id", decryptFields(SENSITIVE_FIELDS), authenticate, rbac("staff", "healthworker","resident"), getNotificationsByResidentId)
router.get("/:receiver", decryptFields(SENSITIVE_FIELDS), authenticate, rbac("staff", "healthworker","resident"), getNotificationsByRole)
router.put("/:id", encryptFields(SENSITIVE_FIELDS), authenticate, rbac("staff", "healthworker","resident"), updateNotification)
router.delete("/:id", authenticate, rbac("staff", "healthworker","resident"), deleteNotification)

export default router