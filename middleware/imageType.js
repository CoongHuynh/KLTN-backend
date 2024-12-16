const multer = require("multer");

// Cấu hình multer để lưu trữ file trong bộ nhớ
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (!file) {
      return cb(new Error("No file uploaded"));
    }

    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      file.originalname.split(".").pop().toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      return cb(
        new Error(
          "Only images of type jpeg, jpg, png, gif, or webp are allowed"
        )
      );
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn kích thước tệp tin là 5MB
});

const imageType = (req, res, next) => {
  upload.array("images", 10)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

module.exports = { imageType };
