import multer from "multer";

export function multerImageUploadErrorHandler(multerMiddleware) {
  return (req, res, next) => {
    multerMiddleware(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({
            error: "File too large. Max allowed size is 5MB",
          });
        }
        return res.status(400).json({ error: err.message });
      } else if (err) {
        // Custom fileFilter error or unexpected error
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  };
}
