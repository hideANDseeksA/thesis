import express from "express";
import {
  createBlotter,
  getbBlotter,
  searchBlotters,
  getBlotterById,
  updateBlotter,
  deleteBlotter,
  getBlotterReport,
  updateBlotterStatus

} from "../controllers/blotter.controller";
import { encryptFields } from "../middleware/encrypt.middleware";
import { decryptFields } from "../middleware/decrypt.middleware";
import { upload } from "../middleware/upload"
import { authenticate } from "../middleware/auth.middleware";
import { rbac } from "../middleware/rbac";

const router = express.Router();
const SENSITIVE_FIELDS = ["details"];


router.post(
  "/",
  upload.single("file"),       
  encryptFields(SENSITIVE_FIELDS),  
  authenticate,
  rbac("staff"),
  createBlotter          
)



router.get(
    "/",
    decryptFields(SENSITIVE_FIELDS),
    authenticate,
    rbac("staff"),
    getbBlotter


)


router.get(
  "/report",
  authenticate,
  rbac("staff"),
  getBlotterReport
)
router.patch  (
  "/:id/status",
  authenticate,
  rbac("staff"),
  updateBlotterStatus
)
router.get(
  "/:id",
  authenticate,
  rbac("staff"),
  decryptFields(SENSITIVE_FIELDS),
  getBlotterById
)


router.put(
    "/:id",
    upload.single("file"),
    encryptFields(SENSITIVE_FIELDS),
    authenticate,
    rbac("staff"),
    updateBlotter
)


router.delete(
    "/:id",
    authenticate,
    rbac("staff"),
    deleteBlotter
)
router.post("/search",decryptFields(SENSITIVE_FIELDS), searchBlotters);


export default router;
