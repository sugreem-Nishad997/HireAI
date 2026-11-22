import multer from "multer";

// Maximum resume size: 5 MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed MIME types
const allowedMimeTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Configure multer
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExtensions = [".pdf", ".docx"];
  const extension = file.originalname
    .slice(file.originalname.lastIndexOf("."))
    .toLowerCase();

  // Check extension
  if (!allowedExtensions.includes(extension)) {
    return cb(new Error("Only PDF and DOCX files are allowed."));
  }

  // Check MIME type
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error("Invalid file type. Upload a PDF or DOCX."));
  }

  cb(null, true);
};

// Create multer upload middleware
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});

// Export middleware for one resume file
export const uploadResume = upload.single("resume");