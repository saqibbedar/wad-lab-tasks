import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// ********************* 0. create uploads/product-images directory if don't exit ********************

// setup the directory path
const uploadDir = path.resolve("public/uploads/product-images");
// console.log(uploadDir);

// check if directly already exist? Else create a new one 
if(!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {recursive: true});
}

// ********************* 1. create storage options ****************************************************
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const fileUniqueName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}-${path.extname(file.originalname)}`;
        cb(null, fileUniqueName);
    }
});

const uploadImage = multer({
    storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // 5mb
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        console.log("file in fileFilter:",file);
        if(allowedTypes.includes(file.mimetype)) {
            console.log("file mimetype:",file.mimetype)
            cb(null, true);
        } else {
            cb(new Error("Only jpg, jpeg, png, webp images are allowed"));
        }
    }
})

export default uploadImage;