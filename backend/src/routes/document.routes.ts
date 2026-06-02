import express from "express";
import {
  createDocuments,
  getDocuments,
  updateDocuments,
  deleteDocuments,
  getResidentDocuments
} from "../controllers/document.controller";

import { encryptFields } from "../middleware/encrypt.middleware";
import { decryptFields } from "../middleware/decrypt.middleware";
import { upload } from "../middleware/upload";

import { authenticate } from "../middleware/auth.middleware";
import { rbac } from "../middleware/rbac";
const router = express.Router();
const SENSITIVE_FIELDS = ["title", "purpose"];


router.post("/", 
  upload.single("file"), 
  encryptFields(SENSITIVE_FIELDS), 
  authenticate,
  rbac("staff"),
  createDocuments);


router.get("/", 
  decryptFields(SENSITIVE_FIELDS),
  authenticate,
  rbac("staff"),
  getDocuments
);

router.get("/resident", 
  decryptFields(SENSITIVE_FIELDS),
  authenticate,
  rbac("staff", "healthworker", "resident"),
  getResidentDocuments
);


router.put("/:id", 
  upload.single("file"), 
  encryptFields(SENSITIVE_FIELDS), 
  authenticate,
  rbac("staff"),
  updateDocuments
);


router.delete("/:id", 
  authenticate,
  rbac("staff"),
  deleteDocuments
);

export default router;
