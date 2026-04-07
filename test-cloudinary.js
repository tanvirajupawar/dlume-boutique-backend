require("dotenv").config();
const cloudinary = require("./config/cloudinary");

(async () => {
  try {
    console.log("Uploading test image...");

    const result = await cloudinary.uploader.upload(
     "./test.jpeg"
    );

    console.log("✅ SUCCESS");
    console.log("URL:", result.secure_url);
  } catch (err) {
    console.log("❌ ERROR");
    console.log(err);
  }
})();