import express from "express";
import {
    createComplaints,
    getcomplaints,
    updatecomplaints,
    deletecomplaints,
} from "../controllers/complaints.controller";
import { upload } from "../middleware/upload";
import { decryptFields } from "../middleware/decrypt.middleware";
import { encryptFields } from "../middleware/encrypt.middleware";
import { authenticate } from "../middleware/auth.middleware";
import { rbac } from "../middleware/rbac";
const SENSITIVE_FIELDS = ["complaint_type","description"];
const router = express.Router();


router.post(
    "/",
    upload.single("file"),
    encryptFields(SENSITIVE_FIELDS),
    authenticate,
    rbac("staff", "resident", "healthworker"),
    createComplaints
);


router.get("/", 
    authenticate,
    rbac("staff"),
    decryptFields(SENSITIVE_FIELDS),
     getcomplaints);

router.put(
    "/:id",
    upload.single("file"),
    encryptFields(SENSITIVE_FIELDS),
    authenticate,
    rbac("staff"),
    updatecomplaints
);

router.delete("/:id", 
    authenticate,
    rbac("staff"),
    deletecomplaints
);

export default router;
