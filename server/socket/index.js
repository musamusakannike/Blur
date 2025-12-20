import jwt from "jsonwebtoken"
import Room from "../models/Room.model.js"
import logger from "../config/logger.js"

export const initSocketIO = (io) => {
  // Middleware for socket authentication (optional)
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        socket.userId = decoded.id
        socket.isAuthenticated = true
      } catch (error) {
        socket.isAuthenticated = false
      }
    } else {
      socket.isAuthenticated = false
    }

    next()
  })

  io.on("connection", (socket) => {
    logger.debug(`Socket connected: ${socket.id}`)

    // Join room
    socket.on("room:join", async ({ roomCode }) => {
      try {
        const room = await Room.findOne({ code: roomCode.toUpperCase() })

        if (!room) {
          return socket.emit("room:error", { message: "Room not found" })
        }

        if (room.isExpired()) {
          return socket.emit("room:error", { message: "Room has expired" })
        }

        // Check max participants
        if (room.participants.length >= room.maxParticipants) {
          return socket.emit("room:error", { message: "Room is full" })
        }

        // Add participant to room
        room.participants.push({
          socketId: socket.id,
          joinedAt: new Date(),
        })
        await room.save()

        // Join socket room
        socket.join(roomCode.toUpperCase())
        socket.currentRoom = roomCode.toUpperCase()

        // Notify user
        socket.emit("room:joined", {
          roomCode: room.code,
          participantsCount: room.getParticipantsCount(),
        })

        // Notify other participants
        socket.to(roomCode.toUpperCase()).emit("room:participant-joined", {
          participantsCount: room.getParticipantsCount(),
        })

        logger.info(`Socket ${socket.id} joined room ${roomCode}`)
      } catch (error) {
        logger.error(`Error joining room: ${error.message}`)
        socket.emit("room:error", { message: "Failed to join room" })
      }
    })

    // Send message
    socket.on("room:message", async ({ roomCode, content, type = "text", mediaData }) => {
      try {
        const room = await Room.findOne({ code: roomCode.toUpperCase() })

        if (!room) {
          return socket.emit("room:error", { message: "Room not found" })
        }

        if (room.isExpired()) {
          return socket.emit("room:error", { message: "Room has expired" })
        }

        // Check if socket is in the room
        const isInRoom = room.participants.some((p) => p.socketId === socket.id)
        if (!isInRoom) {
          return socket.emit("room:error", { message: "You must join the room first" })
        }

        const message = {
          type,
          tempUserId: socket.id,
          createdAt: new Date(),
        }

        // Handle different message types
        if (type === "text") {
          if (!content || content.trim().length === 0) {
            return socket.emit("room:error", { message: "Message content is required" })
          }

          if (content.length > room.settings.maxMessageLength) {
            return socket.emit("room:error", {
              message: `Message exceeds maximum length of ${room.settings.maxMessageLength} characters`,
            })
          }

          message.content = content.trim()
        } else if (["image", "video", "audio"].includes(type)) {
          if (!room.settings.allowMedia) {
            return socket.emit("room:error", { message: "Media is not allowed in this room" })
          }

          if (!mediaData) {
            return socket.emit("room:error", { message: "Media data is required" })
          }

          // Handle media upload (mediaData should be base64 or buffer)
          // This is a simplified version - in production, handle this more robustly
          const mediaUrl = mediaData.url || null
          const mediaPublicId = mediaData.publicId || null
          const mediaSize = mediaData.size || 0

          message.mediaUrl = mediaUrl
          message.mediaPublicId = mediaPublicId
          message.mediaSize = mediaSize
          message.content = content || "" // Optional caption
        }

        // Save message to room
        room.messages.push(message)
        await room.save()

        // Get the saved message with ID
        const savedMessage = room.messages[room.messages.length - 1]

        // Broadcast message to all room participants
        io.to(roomCode.toUpperCase()).emit("room:new-message", {
          id: savedMessage._id,
          content: savedMessage.content,
          type: savedMessage.type,
          mediaUrl: savedMessage.mediaUrl,
          mediaSize: savedMessage.mediaSize,
          createdAt: savedMessage.createdAt,
        })

        logger.debug(`Message sent in room ${roomCode}`)
      } catch (error) {
        logger.error(`Error sending message: ${error.message}`)
        socket.emit("room:error", { message: "Failed to send message" })
      }
    })

    // Typing indicator
    socket.on("room:typing", ({ roomCode, isTyping }) => {
      socket.to(roomCode.toUpperCase()).emit("room:user-typing", {
        isTyping,
      })
    })

    // Leave room
    socket.on("room:leave", async ({ roomCode }) => {
      await handleRoomLeave(socket, roomCode, io)
    })

    // Disconnect
    socket.on("disconnect", async () => {
      if (socket.currentRoom) {
        await handleRoomLeave(socket, socket.currentRoom, io)
      }
      logger.debug(`Socket disconnected: ${socket.id}`)
    })
  })
}

// Helper function to handle room leaving
async function handleRoomLeave(socket, roomCode, io) {
  try {
    const room = await Room.findOne({ code: roomCode.toUpperCase() })

    if (room) {
      // Remove participant
      room.participants = room.participants.filter((p) => p.socketId !== socket.id)
      await room.save()

      // Leave socket room
      socket.leave(roomCode.toUpperCase())

      // Notify other participants
      socket.to(roomCode.toUpperCase()).emit("room:participant-left", {
        participantsCount: room.getParticipantsCount(),
      })

      logger.info(`Socket ${socket.id} left room ${roomCode}`)
    }
  } catch (error) {
    logger.error(`Error leaving room: ${error.message}`)
  }
}
