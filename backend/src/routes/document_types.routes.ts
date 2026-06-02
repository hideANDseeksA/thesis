import express from "express";
import {
  createDocument_types,
  getDocument_types,
  updateDocument_types,
  deleteDocument_types,
} from "../controllers/document_types.controller";
import { authenticate } from "../middleware/auth.middleware";
import { rbac } from "../middleware/rbac";
import { encryptFields } from "../middleware/encrypt.middleware";
import { decryptFields } from "../middleware/decrypt.middleware";
const router = express.Router();
const SENSITIVE_FIELDS = ["name", "description"];


router.post("/", 
    encryptFields(SENSITIVE_FIELDS), 
    authenticate,
    rbac("staff"),
    createDocument_types
);

router.get("/", 
    decryptFields(SENSITIVE_FIELDS),
    authenticate,
    rbac("staff"),
    getDocument_types
);


router.put("/:id", 
    encryptFields(SENSITIVE_FIELDS),
    authenticate,
    rbac("staff"),
    updateDocument_types
);


router.delete("/:id", 
    authenticate,
    rbac("staff"),
    deleteDocument_types
);

export default router;
