import { v2 as cloudinary } from "cloudinary"
import logger from "./logger.js"

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * Upload file to Cloudinary
 */
export const uploadToCloudinary = async (file, folder = "blur") => {
  try {
    const result = await cloudinary.uploader.upload(file.path || file.buffer.toString("base64"), {
      folder: `blur/${folder}`,
      resource_type: "auto",
      transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
    })

    return {
      url: result.secure_url,
      publicId: result.public_id,
      size: result.bytes,
      format: result.format,
      resourceType: result.resource_type,
    }
  } catch (error) {
    logger.error(`Cloudinary upload error: ${error.message}`)
    throw new Error("Failed to upload file to Cloudinary")
  }
}

/**
 * Delete file from Cloudinary
 */
export const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    })
    logger.info(`Deleted from Cloudinary: ${publicId}`)
  } catch (error) {
    logger.error(`Cloudinary delete error: ${error.message}`)
    throw new Error("Failed to delete file from Cloudinary")
  }
}

/**
 * Delete multiple files from Cloudinary
 */
export const deleteManyFromCloudinary = async (publicIds, resourceType = "image") => {
  try {
    await cloudinary.api.delete_resources(publicIds, {
      resource_type: resourceType,
    })
    logger.info(`Deleted ${publicIds.length} files from Cloudinary`)
  } catch (error) {
    logger.error(`Cloudinary bulk delete error: ${error.message}`)
  }
}

export default cloudinary
