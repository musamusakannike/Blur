import mongoose from "mongoose"
import logger from "./logger.js"

const connectDB = async () => {
  try {
    console.log("Attempting to connect to MongoDB...", process.env.MONGODB_URI ? "URI found" : "URI MISSING")
    const conn = await mongoose.connect(process.env.MONGODB_URI)

    logger.info(`MongoDB Connected: ${conn.connection.host}`)
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error("RAW CONSOLE ERROR:", error)
    logger.error(`MongoDB Connection Error: ${error.message}`)
    console.error(`❌ MongoDB Connection Error: ${error.message}`)
    process.exit(1)
  }
}

// Handle MongoDB connection events
mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected")
})

mongoose.connection.on("reconnected", () => {
  logger.info("MongoDB reconnected")
})

export default connectDB
