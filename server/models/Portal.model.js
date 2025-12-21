import mongoose from "mongoose"
import mongoosePaginate from "mongoose-paginate-v2"

const portalMessageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
      maxlength: [5000, "Message cannot exceed 5000 characters"],
    },
    type: {
      type: String,
      enum: ["text", "image", "video", "audio"],
      default: "text",
    },
    mediaUrl: {
      type: String,
    },
    mediaSize: {
      type: Number,
    },
    mediaPublicId: {
      type: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    // Anonymous sender
    senderFingerprint: {
      type: String, // Hashed identifier for spam prevention (optional)
    },
  },
  {
    timestamps: true,
  },
)

const portalSchema = new mongoose.Schema(
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
      required: [true, "Please provide a portal name"],
      trim: true,
      maxlength: [100, "Portal name cannot exceed 100 characters"],
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
      type: String,
    },
    messages: [portalMessageSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    lifetime: {
      type: Number, // Duration in hours
      required: true,
      min: 1,
      max: 24,
    },
    settings: {
      allowMedia: {
        type: Boolean,
        default: true,
      },
      maxMessageLength: {
        type: Number,
        default: 5000,
      },
      requireModeration: {
        type: Boolean,
        default: false,
      },
      allowAnonymousSubmissions: {
        type: Boolean,
        default: true,
      },
    },
    stats: {
      totalMessages: {
        type: Number,
        default: 0,
      },
      unreadMessages: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  },
)

// Add pagination plugin
portalSchema.plugin(mongoosePaginate)

// Index for quick code lookup
// portalSchema.index({ code: 1 }) // Redundant with unique: true
portalSchema.index({ creator: 1, expiresAt: -1 })

// Check if portal is expired
portalSchema.methods.isExpired = function () {
  return new Date() > this.expiresAt
}

// Mark message as read
portalSchema.methods.markMessageAsRead = async function (messageId) {
  const message = this.messages.id(messageId)
  if (message && !message.isRead) {
    message.isRead = true
    message.readAt = new Date()
    this.stats.unreadMessages = Math.max(0, this.stats.unreadMessages - 1)
    await this.save()
  }
  return message
}

// Mark all messages as read
portalSchema.methods.markAllAsRead = async function () {
  this.messages.forEach((msg) => {
    if (!msg.isRead) {
      msg.isRead = true
      msg.readAt = new Date()
    }
  })
  this.stats.unreadMessages = 0
  await this.save()
}

const Portal = mongoose.model("Portal", portalSchema)

export default Portal
