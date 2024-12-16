const cloudinary = require("cloudinary").v2;

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

// Hàm gửi ảnh lên Cloudinary
const uploadToCloudinary = (fileBuffer, fileName, folderPath) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: folderPath, public_id: fileName },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );
    stream.end(fileBuffer);
  });
};

// Controller để upload nhiều ảnh lên Cloudinary
const uploadImages = async (req, res) => {
  try {
    const files = req.files;
    const folderPath = req.body.folderPath || ""; // Lấy folderPath từ body, nếu không có thì để trống

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const uploadResults = [];
    for (const file of files) {
      const url = await uploadToCloudinary(
        file.buffer,
        file.originalname,
        folderPath
      );
      uploadResults.push({ url });
    }

    res.status(201).json(uploadResults);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { uploadToCloudinary, uploadImages };
