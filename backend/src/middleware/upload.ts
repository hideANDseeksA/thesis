import multer from "multer"

export const upload = multer({
  storage: multer.memoryStorage(),
});


export const upload_csv = multer({
  storage: multer.memoryStorage(), 
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "text/csv") {
      cb(new Error("Only CSV files are allowed")); 
    } else {
      cb(null, true); 
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
});