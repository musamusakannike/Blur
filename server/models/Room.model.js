import mongoose from "mongoose"
import mongoosePaginate from "mongoose-paginate-v2"

const messageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ["text", "image", "video", "audio", "file"],
      default: "text",
    },
    mediaUrl: {
      type: String,
    },
    mediaSize: {
      type: Number, // Size in bytes
    },
    mediaPublicId: {
      type: String, // For storage provider reference
    },
    // Anonymous - no sender reference
    tempUserId: {
      type: String, // Socket ID or temporary identifier for the session
    },
  },
  {
    timestamps: true,
  },
)

const roomSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      length: 6,
    },
    name: {
      type: String,
      required: [true, "Please provide a room name"],
      trim: true,
      maxlength: [100, "Room name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    creatorUsername: {
      type: String, // Denormalized for quick access
    },
    messages: [messageSchema],
    participants: [
      {
        socketId: String,
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    maxParticipants: {
      type: Number,
      default: 100,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true, // Index for efficient cleanup queries
    },
    lifetime: {
      type: Number, // Duration in hours
      required: true,
      min: 1,
      max: 6,
    },
    settings: {
      allowMedia: {
        type: Boolean,
        default: true,
      },
      maxMessageLength: {
        type: Number,
        default: 2000,
      },
    },
  },
  {
    timestamps: true,
  },
)

// Add pagination plugin
roomSchema.plugin(mongoosePaginate)

// Index for quick code lookup
roomSchema.index({ code: 1 })

// Check if room is expired
roomSchema.methods.isExpired = function () {
  return new Date() > this.expiresAt
}

// Get active participants count
roomSchema.methods.getParticipantsCount = function () {
  return this.participants.length
}

const Room = mongoose.model("Room", roomSchema)

export default Room
