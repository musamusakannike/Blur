import Portal from "../models/Portal.model.js"
import User from "../models/User.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { generateUniqueCodeWithCheck } from "../utils/generateCode.js"
import logger from "../config/logger.js"
import crypto from "crypto"

/**
 * @desc    Create a new portal
 * @route   POST /api/portals
 * @access  Private
 */
export const createPortal = asyncHandler(async (req, res) => {
  const { name, description, lifetime, allowMedia, requireModeration } = req.body

  // Validate lifetime (1-24 hours)
  if (lifetime < 1 || lifetime > 24) {
    return res.status(400).json({
      success: false,
      message: "Portal lifetime must be between 1 and 24 hours",
    })
  }

  // Generate unique code
  const code = await generateUniqueCodeWithCheck(Portal)

  // Calculate expiration date
  const expiresAt = new Date(Date.now() + lifetime * 60 * 60 * 1000)

  // Create portal
  const portal = await Portal.create({
    code,
    name,
    description,
    creator: req.user.id,
    creatorUsername: req.user.username,
    lifetime,
    expiresAt,
    settings: {
      allowMedia: allowMedia !== undefined ? allowMedia : true,
      requireModeration: requireModeration || false,
    },
  })

  // Update user's created portals count
  await User.findByIdAndUpdate(req.user.id, {
    $inc: { createdPortalsCount: 1 },
  })

  logger.info(`Portal created: ${code} by user ${req.user.username}`)

  res.status(201).json({
    success: true,
    message: "Portal created successfully",
    portal: {
      id: portal._id,
      code: portal.code,
      name: portal.name,
      description: portal.description,
      creatorUsername: portal.creatorUsername,
      expiresAt: portal.expiresAt,
      lifetime: portal.lifetime,
      settings: portal.settings,
      createdAt: portal.createdAt,
    },
  })
})

/**
 * @desc    Get portal by code (public view)
 * @route   GET /api/portals/:code
 * @access  Public
 */
export const getPortalByCode = asyncHandler(async (req, res) => {
  const { code } = req.params

  const portal = await Portal.findOne({ code: code.toUpperCase() }).select("-messages -creator -stats.unreadMessages")

  if (!portal) {
    return res.status(404).json({
      success: false,
      message: "Portal not found",
    })
  }

  if (portal.isExpired()) {
    return res.status(410).json({
      success: false,
      message: "This portal has expired",
    })
  }

  res.status(200).json({
    success: true,
    portal: {
      code: portal.code,
      name: portal.name,
      description: portal.description,
      settings: portal.settings,
      expiresAt: portal.expiresAt,
      createdAt: portal.createdAt,
    },
  })
})

/**
 * @desc    Submit message to portal
 * @route   POST /api/portals/:code/messages
 * @access  Public
 */
export const submitPortalMessage = asyncHandler(async (req, res) => {
  const { code } = req.params
  const { content, type = "text", mediaData } = req.body

  const portal = await Portal.findOne({ code: code.toUpperCase() })

  if (!portal) {
    return res.status(404).json({
      success: false,
      message: "Portal not found",
    })
  }

  if (portal.isExpired()) {
    return res.status(410).json({
      success: false,
      message: "This portal has expired",
    })
  }

  // Create fingerprint for spam prevention (optional)
  const fingerprint = crypto.createHash("sha256").update(`${req.ip}-${req.headers["user-agent"]}`).digest("hex")

  const message = {
    type,
    senderFingerprint: fingerprint,
    createdAt: new Date(),
  }

  // Validate message based on type
  if (type === "text") {
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      })
    }

    if (content.length > portal.settings.maxMessageLength) {
      return res.status(400).json({
        success: false,
        message: `Message exceeds maximum length of ${portal.settings.maxMessageLength} characters`,
      })
    }

    message.content = content.trim()
  } else if (["image", "video", "audio"].includes(type)) {
    if (!portal.settings.allowMedia) {
      return res.status(400).json({
        success: false,
        message: "Media is not allowed in this portal",
      })
    }

    if (!mediaData) {
      return res.status(400).json({
        success: false,
        message: "Media data is required",
      })
    }

    message.mediaUrl = mediaData.url
    message.mediaPublicId = mediaData.publicId
    message.mediaSize = mediaData.size
    message.content = content || ""
  }

  // Add message to portal
  portal.messages.push(message)
  portal.stats.totalMessages += 1
  portal.stats.unreadMessages += 1
  await portal.save()

  // Get the saved message
  const savedMessage = portal.messages[portal.messages.length - 1]

  // Emit socket event to portal creator
  const io = req.app.get("io")
  io.to(`portal-${code.toUpperCase()}`).emit("portal:new-message", {
    portalCode: code,
    messageId: savedMessage._id,
    unreadCount: portal.stats.unreadMessages,
  })

  logger.info(`Message submitted to portal ${code}`)

  res.status(201).json({
    success: true,
    message: "Message submitted successfully",
  })
})

/**
 * @desc    Get portal messages (creator only)
 * @route   GET /api/portals/:code/messages
 * @access  Private
 */
export const getPortalMessages = asyncHandler(async (req, res) => {
  const { code } = req.params
  const { page = 1, limit = 20, unreadOnly = false } = req.query

  const portal = await Portal.findOne({ code: code.toUpperCase() })

  if (!portal) {
    return res.status(404).json({
      success: false,
      message: "Portal not found",
    })
  }

  // Check if user is the creator
  if (portal.creator.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to view these messages",
    })
  }

  // Filter messages
  let messages = portal.messages

  if (unreadOnly === "true") {
    messages = messages.filter((msg) => !msg.isRead)
  }

  // Sort by newest first
  messages = messages.sort((a, b) => b.createdAt - a.createdAt)

  // Pagination
  const startIndex = (page - 1) * limit
  const endIndex = page * limit
  const paginatedMessages = messages.slice(startIndex, endIndex)

  res.status(200).json({
    success: true,
    messages: paginatedMessages.map((msg) => ({
      id: msg._id,
      content: msg.content,
      type: msg.type,
      mediaUrl: msg.mediaUrl,
      mediaSize: msg.mediaSize,
      isRead: msg.isRead,
      readAt: msg.readAt,
      createdAt: msg.createdAt,
    })),
    stats: {
      totalMessages: portal.stats.totalMessages,
      unreadMessages: portal.stats.unreadMessages,
    },
    pagination: {
      page: Number.parseInt(page),
      limit: Number.parseInt(limit),
      total: messages.length,
      hasMore: messages.length > endIndex,
    },
  })
})

/**
 * @desc    Mark message as read
 * @route   PATCH /api/portals/:code/messages/:messageId/read
 * @access  Private
 */
export const markMessageAsRead = asyncHandler(async (req, res) => {
  const { code, messageId } = req.params

  const portal = await Portal.findOne({ code: code.toUpperCase() })

  if (!portal) {
    return res.status(404).json({
      success: false,
      message: "Portal not found",
    })
  }

  if (portal.creator.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: "Not authorized",
    })
  }

  const message = await portal.markMessageAsRead(messageId)

  if (!message) {
    return res.status(404).json({
      success: false,
      message: "Message not found",
    })
  }

  res.status(200).json({
    success: true,
    message: "Message marked as read",
    unreadCount: portal.stats.unreadMessages,
  })
})

/**
 * @desc    Mark all messages as read
 * @route   PATCH /api/portals/:code/messages/read-all
 * @access  Private
 */
export const markAllAsRead = asyncHandler(async (req, res) => {
  const { code } = req.params

  const portal = await Portal.findOne({ code: code.toUpperCase() })

  if (!portal) {
    return res.status(404).json({
      success: false,
      message: "Portal not found",
    })
  }

  if (portal.creator.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: "Not authorized",
    })
  }

  await portal.markAllAsRead()

  res.status(200).json({
    success: true,
    message: "All messages marked as read",
  })
})

/**
 * @desc    Get user's created portals
 * @route   GET /api/portals/my/created
 * @access  Private
 */
export const getMyPortals = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, includeExpired = false } = req.query

  const query = { creator: req.user.id }

  if (!includeExpired) {
    query.expiresAt = { $gt: new Date() }
  }

  const options = {
    page: Number.parseInt(page),
    limit: Number.parseInt(limit),
    sort: { createdAt: -1 },
  }

  const portals = await Portal.paginate(query, options)

  res.status(200).json({
    success: true,
    portals: portals.docs.map((portal) => ({
      id: portal._id,
      code: portal.code,
      name: portal.name,
      description: portal.description,
      stats: portal.stats,
      expiresAt: portal.expiresAt,
      isExpired: portal.isExpired(),
      createdAt: portal.createdAt,
    })),
    pagination: {
      page: portals.page,
      limit: portals.limit,
      totalPages: portals.totalPages,
      totalDocs: portals.totalDocs,
      hasNextPage: portals.hasNextPage,
      hasPrevPage: portals.hasPrevPage,
    },
  })
})

/**
 * @desc    Delete portal (creator only)
 * @route   DELETE /api/portals/:code
 * @access  Private
 */
export const deletePortal = asyncHandler(async (req, res) => {
  const { code } = req.params

  const portal = await Portal.findOne({ code: code.toUpperCase() })

  if (!portal) {
    return res.status(404).json({
      success: false,
      message: "Portal not found",
    })
  }

  if (portal.creator.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to delete this portal",
    })
  }

  // Delete media files
  const { deleteMediaFromPortal } = await import("../services/cleanup.service.js")
  await deleteMediaFromPortal(portal)

  // Delete portal
  await Portal.findByIdAndDelete(portal._id)

  logger.info(`Portal deleted: ${code} by user ${req.user.username}`)

  res.status(200).json({
    success: true,
    message: "Portal deleted successfully",
  })
})

/**
 * @desc    Update portal settings (creator only)
 * @route   PATCH /api/portals/:code
 * @access  Private
 */
export const updatePortal = asyncHandler(async (req, res) => {
  const { code } = req.params
  const { name, description, allowMedia } = req.body

  const portal = await Portal.findOne({ code: code.toUpperCase() })

  if (!portal) {
    return res.status(404).json({
      success: false,
      message: "Portal not found",
    })
  }

  if (portal.creator.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to update this portal",
    })
  }

  if (name) portal.name = name
  if (description !== undefined) portal.description = description
  if (allowMedia !== undefined) portal.settings.allowMedia = allowMedia

  await portal.save()

  res.status(200).json({
    success: true,
    message: "Portal updated successfully",
    portal: {
      id: portal._id,
      code: portal.code,
      name: portal.name,
      description: portal.description,
      settings: portal.settings,
    },
  })
})

/**
 * @desc    Delete a specific message from portal (creator only)
 * @route   DELETE /api/portals/:code/messages/:messageId
 * @access  Private
 */
export const deletePortalMessage = asyncHandler(async (req, res) => {
  const { code, messageId } = req.params

  const portal = await Portal.findOne({ code: code.toUpperCase() })

  if (!portal) {
    return res.status(404).json({
      success: false,
      message: "Portal not found",
    })
  }

  if (portal.creator.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: "Not authorized",
    })
  }

  const message = portal.messages.id(messageId)

  if (!message) {
    return res.status(404).json({
      success: false,
      message: "Message not found",
    })
  }

  // Delete media if exists
  if (message.mediaPublicId) {
    const { deleteFromStorage } = await import("../utils/storage.js")
    await deleteFromStorage(message.mediaUrl, message.mediaPublicId)
  }

  // Remove message
  message.deleteOne()
  portal.stats.totalMessages = Math.max(0, portal.stats.totalMessages - 1)
  if (!message.isRead) {
    portal.stats.unreadMessages = Math.max(0, portal.stats.unreadMessages - 1)
  }

  await portal.save()

  res.status(200).json({
    success: true,
    message: "Message deleted successfully",
  })
})
