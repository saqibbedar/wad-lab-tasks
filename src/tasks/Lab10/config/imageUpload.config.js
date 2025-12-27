import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// ********************* 0. create uploads/product-images directory if don't exit ********************

// setup the directory path
// NOTE: Vercel's filesystem is read-only except for /tmp, so we must use os.tmpdir() there.
const uploadDir = path.resolve("tmp", "uploads", "product-images");

// ********************* 1. create storage options ****************************************************
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      ensureDir(uploadDir);
      cb(null, uploadDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const fileUniqueName = `${Date.now()}-${crypto
      .randomBytes(6)
      .toString("hex")}${path.extname(file.originalname)}`;
    cb(null, fileUniqueName);
  },
});

const uploadImage = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5mb
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    console.log("file in fileFilter:", file);
    if (allowedTypes.includes(file.mimetype)) {
      console.log("file mimetype:", file.mimetype);
      cb(null, true);
    } else {
      cb(new Error("Only jpg, jpeg, png, webp images are allowed"));
    }
  },
});

export default uploadImage;
