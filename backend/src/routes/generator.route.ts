import { Router } from "express"
import {
  updateAndGenerateCertificate,
  generateBlotterDocument
} from "../controllers/form.generator.controller"
import { encryptFields } from "../middleware/encrypt.middleware"
import { createAndGenerateCertificate } from "../controllers/transaction.controller"
import {authenticate} from "../middleware/auth.middleware"
import { rbac } from "../middleware/rbac"

const router = Router()
const SENSITIVE_FIELDS = ["details"];

router.post(
  "/transactions/generate-certificate",
    encryptFields(SENSITIVE_FIELDS),
    authenticate,
  rbac("staff"),
  createAndGenerateCertificate
)

// 🔹 Update transaction + generate certificate
// PUT /api/transactions/:id/generate
router.put(
  "/transactions/:id/generate",
    encryptFields(SENSITIVE_FIELDS),
    authenticate,
  rbac("staff"),
  updateAndGenerateCertificate
)


router.post(
  "/blotter/:id/generate",
  authenticate,
  rbac("staff"),
  generateBlotterDocument
)
export default router