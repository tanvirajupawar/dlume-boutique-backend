const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_SECRET_KEY,
});

// ✅ Upload function
const uploadToCloudinary = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "orders",
    });

    return result.secure_url; // ✅ IMPORTANT
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

module.exports = { uploadToCloudinary };