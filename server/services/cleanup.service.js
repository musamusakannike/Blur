import Room from "../models/Room.model.js"
import Portal from "../models/Portal.model.js"
import { deleteManyFromStorage } from "../utils/storage.js"
import logger from "../config/logger.js"

/**
 * Delete media files from a room
 */
export const deleteMediaFromRoom = async (room) => {
  try {
    const mediaFiles = room.messages
      .filter((msg) => msg.mediaPublicId)
      .map((msg) => ({
        publicId: msg.mediaPublicId,
        url: msg.mediaUrl,
        type: msg.type,
        mediaPublicId: msg.mediaPublicId,
      }))

    if (mediaFiles.length > 0) {
      await deleteManyFromStorage(mediaFiles)
      logger.info(`Deleted ${mediaFiles.length} media files from room ${room.code}`)
    }
  } catch (error) {
    logger.error(`Error deleting media from room ${room.code}: ${error.message}`)
  }
}

/**
 * Delete media files from a portal
 */
export const deleteMediaFromPortal = async (portal) => {
  try {
    const mediaFiles = portal.messages
      .filter((msg) => msg.mediaPublicId)
      .map((msg) => ({
        publicId: msg.mediaPublicId,
        url: msg.mediaUrl,
        type: msg.type,
        mediaPublicId: msg.mediaPublicId,
      }))

    if (mediaFiles.length > 0) {
      await deleteManyFromStorage(mediaFiles)
      logger.info(`Deleted ${mediaFiles.length} media files from portal ${portal.code}`)
    }
  } catch (error) {
    logger.error(`Error deleting media from portal ${portal.code}: ${error.message}`)
  }
}

/**
 * Clean up expired rooms
 */
export const cleanupExpiredRooms = async () => {
  try {
    logger.info("Starting cleanup of expired rooms...")

    // Find all expired rooms
    const expiredRooms = await Room.find({
      expiresAt: { $lt: new Date() },
    })

    if (expiredRooms.length === 0) {
      logger.info("No expired rooms to clean up")
      return { deletedCount: 0, mediaDeletedCount: 0 }
    }

    let totalMediaDeleted = 0

    // Delete media files for each room
    for (const room of expiredRooms) {
      const mediaCount = room.messages.filter((msg) => msg.mediaPublicId).length
      await deleteMediaFromRoom(room)
      totalMediaDeleted += mediaCount
    }

    // Delete all expired rooms
    const result = await Room.deleteMany({
      expiresAt: { $lt: new Date() },
    })

    logger.info(`Cleanup complete: Deleted ${result.deletedCount} expired rooms and ${totalMediaDeleted} media files`)

    return {
      deletedCount: result.deletedCount,
      mediaDeletedCount: totalMediaDeleted,
    }
  } catch (error) {
    logger.error(`Error during room cleanup: ${error.message}`)
    throw error
  }
}

/**
 * Clean up expired portals
 */
export const cleanupExpiredPortals = async () => {
  try {
    logger.info("Starting cleanup of expired portals...")

    // Find all expired portals
    const expiredPortals = await Portal.find({
      expiresAt: { $lt: new Date() },
    })

    if (expiredPortals.length === 0) {
      logger.info("No expired portals to clean up")
      return { deletedCount: 0, mediaDeletedCount: 0 }
    }

    let totalMediaDeleted = 0

    // Delete media files for each portal
    for (const portal of expiredPortals) {
      const mediaCount = portal.messages.filter((msg) => msg.mediaPublicId).length
      await deleteMediaFromPortal(portal)
      totalMediaDeleted += mediaCount
    }

    // Delete all expired portals
    const result = await Portal.deleteMany({
      expiresAt: { $lt: new Date() },
    })

    logger.info(`Cleanup complete: Deleted ${result.deletedCount} expired portals and ${totalMediaDeleted} media files`)

    return {
      deletedCount: result.deletedCount,
      mediaDeletedCount: totalMediaDeleted,
    }
  } catch (error) {
    logger.error(`Error during portal cleanup: ${error.message}`)
    throw error
  }
}

/**
 * Clean up inactive room participants (disconnected sockets)
 */
export const cleanupInactiveParticipants = async () => {
  try {
    logger.info("Starting cleanup of inactive participants...")

    // Remove participants who joined more than 12 hours ago (likely disconnected)
    const cutoffTime = new Date(Date.now() - 12 * 60 * 60 * 1000)

    const result = await Room.updateMany(
      {},
      {
        $pull: {
          participants: {
            joinedAt: { $lt: cutoffTime },
          },
        },
      },
    )

    logger.info(`Cleaned up inactive participants from ${result.modifiedCount} rooms`)

    return { modifiedCount: result.modifiedCount }
  } catch (error) {
    logger.error(`Error during participant cleanup: ${error.message}`)
    throw error
  }
}

/**
 * Get cleanup statistics
 */
export const getCleanupStats = async () => {
  try {
    const now = new Date()

    const [expiredRoomsCount, expiredPortalsCount, activeRoomsCount, activePortalsCount] = await Promise.all([
      Room.countDocuments({ expiresAt: { $lt: now } }),
      Portal.countDocuments({ expiresAt: { $lt: now } }),
      Room.countDocuments({ expiresAt: { $gte: now } }),
      Portal.countDocuments({ expiresAt: { $gte: now } }),
    ])

    return {
      expiredRooms: expiredRoomsCount,
      expiredPortals: expiredPortalsCount,
      activeRooms: activeRoomsCount,
      activePortals: activePortalsCount,
    }
  } catch (error) {
    logger.error(`Error getting cleanup stats: ${error.message}`)
    return null
  }
}
