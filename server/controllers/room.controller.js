import Room from "../models/Room.model.js"
import User from "../models/User.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { generateUniqueCodeWithCheck } from "../utils/generateCode.js"
import logger from "../config/logger.js"

/**
 * @desc    Create a new room
 * @route   POST /api/rooms
 * @access  Private
 */
export const createRoom = asyncHandler(async (req, res) => {
  const { name, description, lifetime, allowMedia, maxMessageLength } = req.body

  // Validate lifetime (1-6 hours)
  if (lifetime < 1 || lifetime > 6) {
    return res.status(400).json({
      success: false,
      message: "Room lifetime must be between 1 and 6 hours",
    })
  }

  // Generate unique code
  const code = await generateUniqueCodeWithCheck(Room)

  // Calculate expiration date
  const expiresAt = new Date(Date.now() + lifetime * 60 * 60 * 1000)

  // Create room
  const room = await Room.create({
    code,
    name,
    description,
    creator: req.user.id,
    creatorUsername: req.user.username,
    lifetime,
    expiresAt,
    settings: {
      allowMedia: allowMedia !== undefined ? allowMedia : true,
      maxMessageLength: maxMessageLength || 2000,
    },
  })

  // Update user's created rooms count
  await User.findByIdAndUpdate(req.user.id, {
    $inc: { createdRoomsCount: 1 },
  })

  logger.info(`Room created: ${code} by user ${req.user.username}`)

  res.status(201).json({
    success: true,
    message: "Room created successfully",
    room: {
      id: room._id,
      code: room.code,
      name: room.name,
      description: room.description,
      creatorUsername: room.creatorUsername,
      expiresAt: room.expiresAt,
      lifetime: room.lifetime,
      settings: room.settings,
      createdAt: room.createdAt,
    },
  })
})

/**
 * @desc    Get room by code
 * @route   GET /api/rooms/:code
 * @access  Public (with optional auth)
 */
export const getRoomByCode = asyncHandler(async (req, res) => {
  const { code } = req.params

  const room = await Room.findOne({ code: code.toUpperCase() }).select("-messages")

  if (!room) {
    return res.status(404).json({
      success: false,
      message: "Room not found",
    })
  }

  // Check if room is expired
  if (room.isExpired()) {
    return res.status(410).json({
      success: false,
      message: "This room has expired",
    })
  }

  res.status(200).json({
    success: true,
    room: {
      id: room._id,
      code: room.code,
      name: room.name,
      description: room.description,
      creatorUsername: room.creatorUsername,
      participantsCount: room.getParticipantsCount(),
      maxParticipants: room.maxParticipants,
      expiresAt: room.expiresAt,
      lifetime: room.lifetime,
      settings: room.settings,
      createdAt: room.createdAt,
    },
  })
})

/**
 * @desc    Verify room access with ID and code
 * @route   POST /api/rooms/:roomId/verify
 * @access  Public
 */
export const verifyRoomAccess = asyncHandler(async (req, res) => {
  const { roomId } = req.params
  const { code } = req.body

  // Validate room exists
  const room = await Room.findById(roomId).select("-messages")

  if (!room) {
    return res.status(404).json({
      success: false,
      message: "Room not found",
    })
  }

  // Verify code matches
  if (room.code !== code.toUpperCase()) {
    return res.status(403).json({
      success: false,
      message: "Invalid room code",
    })
  }

  // Check if room is expired
  if (room.isExpired()) {
    return res.status(410).json({
      success: false,
      message: "This room has expired",
    })
  }

  res.status(200).json({
    success: true,
    verified: true,
    room: {
      id: room._id,
      code: room.code,
      name: room.name,
      description: room.description,
      creatorUsername: room.creatorUsername,
      participantsCount: room.getParticipantsCount(),
      maxParticipants: room.maxParticipants,
      expiresAt: room.expiresAt,
      lifetime: room.lifetime,
      settings: room.settings,
      createdAt: room.createdAt,
    },
  })
})

/**
 * @desc    Get room messages
 * @route   GET /api/rooms/:code/messages
 * @access  Public (must be in room)
 */
export const getRoomMessages = asyncHandler(async (req, res) => {
  const { code } = req.params
  const { page = 1, limit = 50 } = req.query

  const room = await Room.findOne({ code: code.toUpperCase() })

  if (!room) {
    return res.status(404).json({
      success: false,
      message: "Room not found",
    })
  }

  if (room.isExpired()) {
    return res.status(410).json({
      success: false,
      message: "This room has expired",
    })
  }

  // Get paginated messages (newest first)
  const messages = room.messages
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice((page - 1) * limit, page * limit)
    .reverse() // Return in chronological order

  res.status(200).json({
    success: true,
    messages: messages.map((msg) => ({
      id: msg._id,
      content: msg.content,
      type: msg.type,
      mediaUrl: msg.mediaUrl,
      mediaSize: msg.mediaSize,
      createdAt: msg.createdAt,
    })),
    pagination: {
      page: Number.parseInt(page),
      limit: Number.parseInt(limit),
      total: room.messages.length,
      hasMore: room.messages.length > page * limit,
    },
  })
})

/**
 * @desc    Get user's created rooms
 * @route   GET /api/rooms/my/created
 * @access  Private
 */
export const getMyRooms = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, includeExpired = false } = req.query

  const query = { creator: req.user.id }

  if (!includeExpired) {
    query.expiresAt = { $gt: new Date() }
  }

  const options = {
    page: Number.parseInt(page),
    limit: Number.parseInt(limit),
    sort: { createdAt: -1 },
    select: "-messages",
  }

  const rooms = await Room.paginate(query, options)

  res.status(200).json({
    success: true,
    rooms: rooms.docs.map((room) => ({
      id: room._id,
      code: room.code,
      name: room.name,
      description: room.description,
      participantsCount: room.getParticipantsCount(),
      expiresAt: room.expiresAt,
      isExpired: room.isExpired(),
      createdAt: room.createdAt,
    })),
    pagination: {
      page: rooms.page,
      limit: rooms.limit,
      totalPages: rooms.totalPages,
      totalDocs: rooms.totalDocs,
      hasNextPage: rooms.hasNextPage,
      hasPrevPage: rooms.hasPrevPage,
    },
  })
})

/**
 * @desc    Delete room (creator only)
 * @route   DELETE /api/rooms/:code
 * @access  Private
 */
export const deleteRoom = asyncHandler(async (req, res) => {
  const { code } = req.params

  const room = await Room.findOne({ code: code.toUpperCase() })

  if (!room) {
    return res.status(404).json({
      success: false,
      message: "Room not found",
    })
  }

  // Check if user is the creator
  if (room.creator.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to delete this room",
    })
  }

  // Delete media files associated with room messages
  const { deleteMediaFromRoom } = await import("../services/cleanup.service.js")
  await deleteMediaFromRoom(room)

  // Delete room
  await Room.findByIdAndDelete(room._id)

  // Emit room deletion event to all participants
  const io = req.app.get("io")
  io.to(code.toUpperCase()).emit("room:deleted", {
    message: "This room has been deleted by the creator",
  })

  logger.info(`Room deleted: ${code} by user ${req.user.username}`)

  res.status(200).json({
    success: true,
    message: "Room deleted successfully",
  })
})

/**
 * @desc    Update room settings (creator only)
 * @route   PATCH /api/rooms/:code
 * @access  Private
 */
export const updateRoom = asyncHandler(async (req, res) => {
  const { code } = req.params
  const { name, description, allowMedia } = req.body

  const room = await Room.findOne({ code: code.toUpperCase() })

  if (!room) {
    return res.status(404).json({
      success: false,
      message: "Room not found",
    })
  }

  // Check if user is the creator
  if (room.creator.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to update this room",
    })
  }

  if (name) room.name = name
  if (description !== undefined) room.description = description
  if (allowMedia !== undefined) room.settings.allowMedia = allowMedia

  await room.save()

  // Emit room update to all participants
  const io = req.app.get("io")
  io.to(code.toUpperCase()).emit("room:updated", {
    name: room.name,
    description: room.description,
    settings: room.settings,
  })

  res.status(200).json({
    success: true,
    message: "Room updated successfully",
    room: {
      id: room._id,
      code: room.code,
      name: room.name,
      description: room.description,
      settings: room.settings,
    },
  })
})
