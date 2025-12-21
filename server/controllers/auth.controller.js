import crypto from "crypto"
import User from "../models/User.model.js"
import logger from "../config/logger.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { sendEmail } from "../utils/email.js"
import admin from "../config/firebase.js"

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { username, email, password, displayName } = req.body

  // Check if user exists
  const userExists = await User.findOne({ $or: [{ email }, { username }] })

  if (userExists) {
    return res.status(400).json({
      success: false,
      message: userExists.email === email ? "Email already registered" : "Username already taken",
    })
  }

  // Create user
  const user = await User.create({
    username,
    email,
    password,
    displayName: displayName || username,
  })

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString("hex")
  user.verificationToken = crypto.createHash("sha256").update(verificationToken).digest("hex")
  await user.save()

  // Send verification email (optional)
  try {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`
    await sendEmail({
      to: user.email,
      subject: "Verify Your Blur Account",
      html: `
        <h1>Welcome to Blur!</h1>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
        <p>This link will expire in 24 hours.</p>
      `,
    })
  } catch (error) {
    logger.error(`Error sending verification email: ${error.message}`)
  }

  // Generate token
  const token = user.generateToken()

  res.status(201).json({
    success: true,
    message: "Registration successful",
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar,
      isVerified: user.isVerified,
    },
  })
})

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  // Validate input
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Please provide email and password",
    })
  }

  // Check for user (include password field)
  const user = await User.findOne({ email }).select("+password")

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    })
  }

  // Check password
  const isPasswordCorrect = await user.comparePassword(password)

  if (!isPasswordCorrect) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    })
  }

  // Update last login
  user.lastLogin = Date.now()
  await user.save()

  // Generate token
  const token = user.generateToken()

  res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar,
      isVerified: user.isVerified,
    },
  })
})

/**
 * @desc    Login with Google
 * @route   POST /api/auth/google
 * @access  Public
 */
export const googleLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body

  if (!idToken) {
    return res.status(400).json({
      success: false,
      message: "ID token is required",
    })
  }

  try {
    // Verify ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken)
    const { email, name, picture, uid } = decodedToken

    // Check if user exists
    let user = await User.findOne({ email })

    if (!user) {
      // Generate unique username from email part
      let baseUsername = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "")
      if (baseUsername.length < 3) baseUsername = `user${crypto.randomBytes(3).toString("hex")}`
      
      let username = baseUsername
      let counter = 1
      
      // Ensure unique username
      while (await User.findOne({ username })) {
        username = `${baseUsername}${counter}`
        counter++
      }

      // Create new user
      user = await User.create({
        username,
        email,
        password: crypto.randomBytes(16).toString("hex"), // Random secure password
        displayName: name || username,
        avatar: picture,
        isVerified: true, // Google verified
      })
    }

    // Update last login
    user.lastLogin = Date.now()
    await user.save()

    // Generate token
    const token = user.generateToken()

    res.status(200).json({
      success: true,
      message: "Google login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
    })
  } catch (error) {
    logger.error(`Google login error: ${error.message}`)
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    })
  }
})

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar,
      bio: user.bio,
      isVerified: user.isVerified,
      createdRoomsCount: user.createdRoomsCount,
      createdPortalsCount: user.createdPortalsCount,
      createdAt: user.createdAt,
    },
  })
})

/**
 * @desc    Verify email
 * @route   POST /api/auth/verify-email/:token
 * @access  Public
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params

  // Hash token
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

  // Find user with token
  const user = await User.findOne({ verificationToken: hashedToken })

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired verification token",
    })
  }

  // Update user
  user.isVerified = true
  user.verificationToken = undefined
  await user.save()

  res.status(200).json({
    success: true,
    message: "Email verified successfully",
  })
})

/**
 * @desc    Forgot password
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body

  const user = await User.findOne({ email })

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "No user found with that email",
    })
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex")
  user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex")
  user.resetPasswordExpire = Date.now() + 3600000 // 1 hour
  await user.save()

  // Send reset email
  try {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`
    await sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <h1>Password Reset</h1>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    })

    res.status(200).json({
      success: true,
      message: "Password reset email sent",
    })
  } catch (error) {
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined
    await user.save()

    logger.error(`Error sending reset email: ${error.message}`)
    return res.status(500).json({
      success: false,
      message: "Error sending reset email",
    })
  }
})

/**
 * @desc    Reset password
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params
  const { password } = req.body

  // Hash token
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

  // Find user with token and check expiry
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  })

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired reset token",
    })
  }

  // Set new password
  user.password = password
  user.resetPasswordToken = undefined
  user.resetPasswordExpire = undefined
  await user.save()

  // Generate new token
  const newToken = user.generateToken()

  res.status(200).json({
    success: true,
    message: "Password reset successful",
    token: newToken,
  })
})

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/update-profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { displayName, bio } = req.body

  const user = await User.findById(req.user.id)

  if (displayName) user.displayName = displayName
  if (bio !== undefined) user.bio = bio

  await user.save()

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar,
      bio: user.bio,
    },
  })
})

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body

  const user = await User.findById(req.user.id).select("+password")

  // Check current password
  const isPasswordCorrect = await user.comparePassword(currentPassword)

  if (!isPasswordCorrect) {
    return res.status(401).json({
      success: false,
      message: "Current password is incorrect",
    })
  }

  // Set new password
  user.password = newPassword
  await user.save()

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  })
})
