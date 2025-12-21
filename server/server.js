import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import cors from "cors"
import helmet from "helmet"
import compression from "compression"
import morgan from "morgan"
import dotenv from "dotenv"
import connectDB from "./config/database.js"
import logger from "./config/logger.js"
import { errorHandler } from "./middleware/errorHandler.js"
import { initSocketIO } from "./socket/index.js"
import { startCronJobs, stopCronJobs } from "./jobs/index.js"

// Import routes
import authRoutes from "./routes/auth.routes.js"
import roomRoutes from "./routes/room.routes.js"
import portalRoutes from "./routes/portal.routes.js"
import userRoutes from "./routes/user.routes.js"
import uploadRoutes from "./routes/upload.routes.js"
import adminRoutes from "./routes/admin.routes.js"

// Load environment variables
dotenv.config()

// Initialize express app
const app = express()
const httpServer = createServer(app)

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    credentials: true,
  },
  maxHttpBufferSize: 10e6, // 10MB for file uploads
})

// Connect to database
connectDB()

// Middleware
app.use(helmet())
app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
)
app.use(compression())
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"))
} else {
  app.use(
    morgan("combined", {
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    }),
  )
}
console.log("Middlewares setup complete")

// Make io accessible to routes
app.set("io", io)

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Blur server is running",
    timestamp: new Date().toISOString(),
  })
})

// API Routes
console.log("Setting up routes...")
app.use("/api/auth", authRoutes)
app.use("/api/rooms", roomRoutes)
app.use("/api/portals", portalRoutes)
app.use("/api/users", userRoutes)
app.use("/api/upload", uploadRoutes)
app.use("/api/admin", adminRoutes)
console.log("Routes setup complete")

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  })
})

// Error handling middleware
console.log("Type of errorHandler:", typeof errorHandler)
app.use(errorHandler)

// Initialize Socket.IO handlers
console.log("Initializing Socket.IO...")
initSocketIO(io)
console.log("Socket.IO initialized")

// Start cron jobs
console.log("Starting cron jobs...")
startCronJobs()
console.log("Cron jobs started")

// Start server
const PORT = process.env.PORT || 5000
console.log("About to listen on port", PORT)
try {
  httpServer.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
    console.log(`🚀 Blur server is running on http://localhost:${PORT}`)
  })
  console.log("Called listen()")
} catch (e) {
  console.error("Error calling listen:", e)
}

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received: closing HTTP server")
  stopCronJobs()
  httpServer.close(() => {
    logger.info("HTTP server closed")
    process.exit(0)
  })
})

process.on("SIGINT", () => {
  logger.info("SIGINT signal received: closing HTTP server")
  stopCronJobs()
  httpServer.close(() => {
    logger.info("HTTP server closed")
    process.exit(0)
  })
})

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`)
  console.log("Shutting down server due to unhandled promise rejection")
  stopCronJobs()
  httpServer.close(() => process.exit(1))
})
