import jwt from "jsonwebtoken"
import User from "../models/User.model.js"
import logger from "../config/logger.js"

export const protect = async (req, res, next) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1]
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    })
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Get user from token
    req.user = await User.findById(decoded.id).select("-password")

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      })
    }

    next()
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`)
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    })
  }
}

// Optional authentication - doesn't block if no token
export const optionalAuth = async (req, res, next) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1]
  }

  if (!token) {
    // No token, continue without user
    req.user = null
    return next()
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id).select("-password")
  } catch (error) {
    // Invalid token, continue without user
    req.user = null
  }

  next()
}
