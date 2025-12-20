import { S3Client, PutObjectCommand, DeleteObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3"
import logger from "./logger.js"

// Configure R2 Client (S3 compatible)
const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

/**
 * Upload file to R2
 */
export const uploadToR2 = async (file, folder = "blur") => {
  try {
    const fileName = `${folder}/${Date.now()}-${file.originalname}`

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    })

    await r2Client.send(command)

    const url = `${process.env.R2_PUBLIC_URL}/${fileName}`

    return {
      url,
      publicId: fileName,
      size: file.size,
      format: file.mimetype.split("/")[1],
      resourceType: file.mimetype.split("/")[0],
    }
  } catch (error) {
    logger.error(`R2 upload error: ${error.message}`)
    throw new Error("Failed to upload file to R2")
  }
}

/**
 * Delete file from R2
 */
export const deleteFromR2 = async (publicId) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: publicId,
    })

    await r2Client.send(command)
    logger.info(`Deleted from R2: ${publicId}`)
  } catch (error) {
    logger.error(`R2 delete error: ${error.message}`)
    throw new Error("Failed to delete file from R2")
  }
}

/**
 * Delete multiple files from R2
 */
export const deleteManyFromR2 = async (publicIds) => {
  try {
    const command = new DeleteObjectsCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Delete: {
        Objects: publicIds.map((id) => ({ Key: id })),
      },
    })

    await r2Client.send(command)
    logger.info(`Deleted ${publicIds.length} files from R2`)
  } catch (error) {
    logger.error(`R2 bulk delete error: ${error.message}`)
  }
}

export default r2Client
