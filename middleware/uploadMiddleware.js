import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

// Cloudinary storage config
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = "livetogether";
    let format = "jpg";

    // Detect format automatically
    if (file.mimetype === "image/png") format = "png";
    if (file.mimetype === "image/webp") format = "webp";
    if (file.mimetype === "application/pdf") format = "pdf";

    return {
      folder,
      resource_type: file.mimetype === "application/pdf" ? "raw" : "image",
      format,
      public_id: `${Date.now()}-${file.originalname.split(".")[0]}`,
    };
  },
});

// File filter (same logic)
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG, WEBP images and PDF files are allowed"), false);
  }
};

const uploadImages = multer({
  storage,
  fileFilter,
});

export default uploadImages;