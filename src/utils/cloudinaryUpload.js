const cloudinary = require("../config/cloudinary");
const ApiError = require("./ApiError");

const uploadBufferToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        return reject(new ApiError(502, error.message || "Cloudinary upload failed"));
      }

      resolve(result);
    });

    stream.end(buffer);
  });
};

const uploadSingleImage = async (file, folder) => {
  if (!file) {
    throw new ApiError(400, "Image file is required");
  }

  if (!file.mimetype || !file.mimetype.startsWith("image/")) {
    throw new ApiError(400, "Only image files are allowed");
  }

  const result = await uploadBufferToCloudinary(file.buffer, {
    folder,
    resource_type: "image",
  });

  return result.secure_url;
};

const uploadMultipleImages = async (files, folder) => {
  if (!Array.isArray(files) || files.length === 0) {
    throw new ApiError(400, "At least one image file is required");
  }

  if (files.length > 5) {
    throw new ApiError(400, "Maximum 5 images allowed");
  }

  return Promise.all(files.map((file) => uploadSingleImage(file, folder)));
};

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
};
