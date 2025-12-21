import admin from "firebase-admin"
import logger from "./logger.js"
import dotenv from "dotenv"

dotenv.config()

try {
  // Check if we have credentials in env vars
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    })
    logger.info("Firebase Admin initialized successfully")
  } else {
    logger.warn("Firebase credentials not found in environment variables. Google OAuth will not work.")
  }
} catch (error) {
  logger.error(`Error initializing Firebase Admin: ${error.message}`)
}

export default admin
