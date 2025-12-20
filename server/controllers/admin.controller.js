import { asyncHandler } from "../utils/asyncHandler.js"
import {
  cleanupExpiredRooms,
  cleanupExpiredPortals,
  cleanupInactiveParticipants,
  getCleanupStats,
} from "../services/cleanup.service.js"
import Room from "../models/Room.model.js"
import Portal from "../models/Portal.model.js"
import User from "../models/User.model.js"
import logger from "../config/logger.js"

/**
 * @desc    Get system statistics
 * @route   GET /api/admin/stats
 * @access  Private (Admin only - you can add admin middleware)
 */
export const getSystemStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalRooms, totalPortals, cleanupStats] = await Promise.all([
    User.countDocuments(),
    Room.countDocuments(),
    Portal.countDocuments(),
    getCleanupStats(),
  ])

  // Get total messages
  const rooms = await Room.find().select("messages")
  const portals = await Portal.find().select("messages")

  const totalRoomMessages = rooms.reduce((acc, room) => acc + room.messages.length, 0)
  const totalPortalMessages = portals.reduce((acc, portal) => acc + portal.messages.length, 0)

  res.status(200).json({
    success: true,
    stats: {
      users: {
        total: totalUsers,
      },
      rooms: {
        total: totalRooms,
        active: cleanupStats?.activeRooms || 0,
        expired: cleanupStats?.expiredRooms || 0,
        totalMessages: totalRoomMessages,
      },
      portals: {
        total: totalPortals,
        active: cleanupStats?.activePortals || 0,
        expired: cleanupStats?.expiredPortals || 0,
        totalMessages: totalPortalMessages,
      },
    },
  })
})

/**
 * @desc    Manually trigger room cleanup
 * @route   POST /api/admin/cleanup/rooms
 * @access  Private (Admin only)
 */
export const manualRoomCleanup = asyncHandler(async (req, res) => {
  logger.info(`Manual room cleanup triggered by user ${req.user.username}`)

  const result = await cleanupExpiredRooms()

  res.status(200).json({
    success: true,
    message: "Room cleanup completed",
    result,
  })
})

/**
 * @desc    Manually trigger portal cleanup
 * @route   POST /api/admin/cleanup/portals
 * @access  Private (Admin only)
 */
export const manualPortalCleanup = asyncHandler(async (req, res) => {
  logger.info(`Manual portal cleanup triggered by user ${req.user.username}`)

  const result = await cleanupExpiredPortals()

  res.status(200).json({
    success: true,
    message: "Portal cleanup completed",
    result,
  })
})

/**
 * @desc    Manually trigger participant cleanup
 * @route   POST /api/admin/cleanup/participants
 * @access  Private (Admin only)
 */
export const manualParticipantCleanup = asyncHandler(async (req, res) => {
  logger.info(`Manual participant cleanup triggered by user ${req.user.username}`)

  const result = await cleanupInactiveParticipants()

  res.status(200).json({
    success: true,
    message: "Participant cleanup completed",
    result,
  })
})

/**
 * @desc    Get cleanup logs
 * @route   GET /api/admin/cleanup/stats
 * @access  Private (Admin only)
 */
export const getCleanupStatistics = asyncHandler(async (req, res) => {
  const stats = await getCleanupStats()

  res.status(200).json({
    success: true,
    stats,
  })
})
