import User from "../models/User.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadToStorage, deleteFromStorage } from "../utils/storage.js"

/**
 * @desc    Get user profile by username
 * @route   GET /api/users/:username
 * @access  Public
 */
export const getUserProfile = asyncHandler(async (req, res) => {
  const { username } = req.params

  const user = await User.findOne({ username }).select(
    "-email -verificationToken -resetPasswordToken -resetPasswordExpire",
  )

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    })
  }

  res.status(200).json({
    success: true,
    user: {
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      bio: user.bio,
      createdAt: user.createdAt,
    },
  })
})

/**
 * @desc    Update user avatar
 * @route   POST /api/users/avatar
 * @access  Private
 */
export const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Please upload an image",
    })
  }

  const user = await User.findById(req.user.id)

  // Delete old avatar if exists
  if (user.avatar) {
    await deleteFromStorage(user.avatar)
  }

  // Upload new avatar
  const avatarUrl = await uploadToStorage(req.file, "avatars")

  user.avatar = avatarUrl
  await user.save()

  res.status(200).json({
    success: true,
    message: "Avatar updated successfully",
    avatar: avatarUrl,
  })
})
