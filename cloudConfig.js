const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME || "default_cloud_name",
    api_key: process.env.CLOUD_API_KEY || "default_api_key",
    api_secret: process.env.CLOUD_API_SECRET || "default_api_secret",
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "wanderlust_DEV",
        allowed_formats: ["png", "jpg", "jpeg"],
    },
});

console.log("Cloudinary config:", cloudinary.config());

module.exports = {
    cloudinary,
    storage,
};
