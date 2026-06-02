import express from "express"
import {
  createTransaction,
  getAppointment,
  getOnlineRequest,
  getTransactionById,
  getHistory,
  updateTransaction,
  deleteTransaction,
    generateTransactionCertificate,
    getTransactionByIds,
    cancelTransaction,
    getTransactionReport
} from "../controllers/transaction.controller"
import { encryptFields } from "../middleware/encrypt.middleware"
import { decryptFields } from "../middleware/decrypt.middleware"
import { rbac } from "../middleware/rbac"
import { authenticate } from "../middleware/auth.middleware"
const router = express.Router()
const SENSITIVE_FIELDS = ["details"];




router.post(
  "/:id/generate",
  decryptFields(SENSITIVE_FIELDS),
  authenticate,
  rbac( "staff"),
  generateTransactionCertificate
)

router.post(
  "/",
  authenticate,
  rbac("staff", "resident","healthworker"),
  encryptFields(SENSITIVE_FIELDS),
  createTransaction
);


router.get("/report",
  decryptFields(SENSITIVE_FIELDS),
  authenticate,
  rbac("staff"),
  getTransactionReport
)

router.get("/appointment-test", 
  decryptFields(SENSITIVE_FIELDS),
  authenticate,
  rbac("staff"),
  getAppointment)

router.get("/history", 
  decryptFields(SENSITIVE_FIELDS),
    authenticate,
    rbac( "staff"),
     getHistory)

router.get("/", 
  decryptFields(SENSITIVE_FIELDS),
    authenticate,
    rbac("staff"),
   getOnlineRequest)




router.get("/:resident_id",
   decryptFields(SENSITIVE_FIELDS),
       authenticate,
       rbac("staff",'resident',"healthworker"),
    getTransactionById)



router.get("/user/:id", 
  decryptFields(SENSITIVE_FIELDS),
    authenticate,
  rbac("staff", "resident","healthworker"),
   getTransactionByIds)


router.patch("/:id",
    authenticate,
  rbac("staff"),
   updateTransaction);

router.put("/:id/cancel",
  authenticate,
  rbac("staff", "resident","healthworker"),
  cancelTransaction);

router.delete("/:id",
    authenticate,
    rbac("staff"),
   deleteTransaction)


export default router
