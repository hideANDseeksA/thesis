import express from "express"
import {
  createResident,
  getResidents,
  getBDACResidents,
  getArchiveResidents,
  getResidentsByID,
  updateResident,
  deleteResident,
  updateResidentRemarks,
  exportResidentsCSV
} from "../controllers/residents.controller"
import { rbac } from "../middleware/rbac";
import { authenticate } from "../middleware/auth.middleware";

import { encryptFields } from "../middleware/encrypt.middleware"
import { decryptFields } from "../middleware/decrypt.middleware"

import { getRBIFormC } from "../controllers/rbiform.controller"


const router = express.Router()

  const SENSITIVE_FIELDS = [
    "f_name",
    "m_name",
    "md_name",
    "l_name",
    "s_name",
    "b_place",
    "house_no",
    "email_address",
    "contact_no",
    "citizenship",
    "occupation",
  ]



router.post("/",  
  encryptFields(SENSITIVE_FIELDS),
  authenticate,
  rbac("staff","healthworker"),
   createResident)

router.patch("/remarks/:id",
  authenticate,
  rbac("staff","healthworker"),
   updateResidentRemarks)

router.get("/", 
  decryptFields(SENSITIVE_FIELDS),
  authenticate,
  rbac("staff","healthworker"),
   getResidents)

router.get("/bdac", authenticate, rbac("staff"), decryptFields(SENSITIVE_FIELDS), getBDACResidents)

router.get("/export/rbi", authenticate, rbac("staff","healthworker"), getRBIFormC)
router.get("/archive", authenticate, rbac("staff","healthworker"), decryptFields(SENSITIVE_FIELDS), getArchiveResidents)

router.get("/:id", authenticate, rbac("staff","healthworker"), decryptFields(SENSITIVE_FIELDS), getResidentsByID)

router.put("/:id",  encryptFields(SENSITIVE_FIELDS), authenticate, rbac("staff","healthworker"), updateResident)

router.delete("/:id", authenticate, rbac("staff","healthworker"), deleteResident)

router.get("/export/csv",  exportResidentsCSV)
export default router