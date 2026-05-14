import multer from "multer";

// Store files in memory because the app streams uploads directly to Cloudinary.
const storage = multer.memoryStorage();

// Reject non-image uploads before they ever reach the controller.
function fileFilter(
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // accept the file
  } else {
    cb(new Error("Only image files are allowed (jpeg, png, webp, gif)"));
  }
}

const upload = multer({
  storage,
  fileFilter,

  // Keep uploads small so image endpoints stay predictable and cheap to process.
  limits: { fileSize: 40 * 1024 * 1024 },
});

export default upload;
