import express from "express"
import {
  createPurok,
  getPurok,
  updatePurok,
  deletePurok,
} from "../controllers/purok.controller"
import { authenticate } from "../middleware/auth.middleware"
import { rbac } from "../middleware/rbac"

const router = express.Router()

router.post("/", authenticate, rbac("staff"), createPurok)

router.get("/", authenticate, rbac("staff","healthworker"), getPurok)


router.put("/:id", authenticate, rbac("staff"), updatePurok)


router.delete("/:id", authenticate, rbac("staff"), deletePurok)

export default router
