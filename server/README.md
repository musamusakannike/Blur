# Blur - Anonymous Social Media Server

An anonymous-based social media platform built with Node.js, Express, Socket.IO, and MongoDB. Blur allows users to create temporary chat rooms and portals for anonymous communication.

## Features

### Room Chats
- Create temporary chat rooms with unique 6-character codes
- Real-time messaging with Socket.IO
- Anonymous messaging (no sender tracking)
- Support for text, images, videos, and audio
- Auto-expire after 1-6 hours
- Join rooms without authentication or with user account

### Portals
- Create anonymous message collection portals
- Users can submit messages anonymously
- Only portal creator can view submitted messages
- Read/unread message tracking
- Auto-expire after 1-24 hours
- Support for text and media messages

### Authentication
- JWT-based authentication
- Email verification
- Password reset functionality
- Secure password hashing with bcrypt
- Profile management

### Media Storage
- Support for Cloudinary and Cloudflare R2
- Image compression with Sharp
- Multiple file upload support
- Automatic cleanup of expired media

### Automated Cleanup
- Cron jobs to delete expired rooms (every 12 hours)
- Cron jobs to delete expired portals (every 48 hours)
- Automatic media deletion from cloud storage
- Cleanup of inactive participants

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.IO
- **Authentication**: JWT, bcryptjs
- **Storage**: Cloudinary / Cloudflare R2
- **Image Processing**: Sharp
- **Validation**: express-validator
- **Logging**: Winston
- **Scheduled Jobs**: node-cron
- **Email**: Nodemailer

## Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Cloudinary or Cloudflare R2 account

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd blur-server
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
   - Database connection string
   - JWT secret
   - Storage provider credentials (Cloudinary or R2)
   - Email service credentials
   - Client URL

5. Start the server:

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000` (or your configured PORT).

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/verify-email/:token` - Verify email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password
- `PUT /api/auth/update-profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Rooms
- `POST /api/rooms` - Create new room (authenticated)
- `GET /api/rooms/:code` - Get room details
- `GET /api/rooms/:code/messages` - Get room messages
- `GET /api/rooms/my/created` - Get user's created rooms (authenticated)
- `DELETE /api/rooms/:code` - Delete room (creator only)
- `PATCH /api/rooms/:code` - Update room settings (creator only)

### Portals
- `POST /api/portals` - Create new portal (authenticated)
- `GET /api/portals/:code` - Get portal details
- `POST /api/portals/:code/messages` - Submit message to portal
- `GET /api/portals/:code/messages` - Get portal messages (creator only)
- `PATCH /api/portals/:code/messages/:messageId/read` - Mark message as read
- `PATCH /api/portals/:code/messages/read-all` - Mark all messages as read
- `DELETE /api/portals/:code/messages/:messageId` - Delete message
- `DELETE /api/portals/:code` - Delete portal (creator only)
- `PATCH /api/portals/:code` - Update portal settings (creator only)

### Upload
- `POST /api/upload` - Upload single file
- `POST /api/upload/multiple` - Upload multiple files

### Admin
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/cleanup/stats` - Get cleanup statistics
- `POST /api/admin/cleanup/rooms` - Manually trigger room cleanup
- `POST /api/admin/cleanup/portals` - Manually trigger portal cleanup
- `POST /api/admin/cleanup/participants` - Manually trigger participant cleanup

## Socket.IO Events

### Room Events (Client → Server)
- `room:join` - Join a room
- `room:leave` - Leave a room
- `room:message` - Send message in room
- `room:typing` - Send typing indicator

### Room Events (Server → Client)
- `room:joined` - Successfully joined room
- `room:error` - Room error occurred
- `room:deleted` - Room was deleted
- `room:updated` - Room settings updated
- `room:participant-joined` - New participant joined
- `room:participant-left` - Participant left
- `room:new-message` - New message received
- `room:user-typing` - User is typing

### Portal Events (Server → Client)
- `portal:new-message` - New message submitted to portal
- `portal:error` - Portal error occurred
- `portal:deleted` - Portal was deleted

## Project Structure

```
blur-server/
├── config/
│   ├── cloudinary.js       # Cloudinary configuration
│   ├── database.js         # MongoDB connection
│   ├── logger.js          # Winston logger setup
│   └── r2.js              # Cloudflare R2 configuration
├── controllers/
│   ├── admin.controller.js
│   ├── auth.controller.js
│   ├── portal.controller.js
│   ├── room.controller.js
│   ├── upload.controller.js
│   └── user.controller.js
├── jobs/
│   └── index.js           # Cron job scheduler
├── middleware/
│   ├── auth.js           # Authentication middleware
│   ├── errorHandler.js   # Error handling middleware
│   ├── upload.js         # Multer configuration
│   └── validate.js       # Request validation
├── models/
│   ├── Portal.model.js   # Portal schema
│   ├── Room.model.js     # Room schema
│   └── User.model.js     # User schema
├── routes/
│   ├── admin.routes.js
│   ├── auth.routes.js
│   ├── portal.routes.js
│   ├── room.routes.js
│   ├── upload.routes.js
│   └── user.routes.js
├── services/
│   └── cleanup.service.js # Cleanup operations
├── socket/
│   ├── events.js         # Socket event constants
│   └── index.js          # Socket.IO handlers
├── utils/
│   ├── asyncHandler.js   # Async error wrapper
│   ├── email.js          # Email utility
│   ├── generateCode.js   # Unique code generator
│   └── storage.js        # Storage abstraction layer
├── logs/                 # Application logs
├── .env.example         # Environment variables template
├── .gitignore
├── package.json
├── README.md
└── server.js            # Application entry point
```

## Environment Variables

See `.env.example` for all required environment variables:

- **Server**: PORT, NODE_ENV, CLIENT_URL
- **Database**: MONGODB_URI
- **JWT**: JWT_SECRET, JWT_EXPIRE
- **Storage**: CLOUDINARY_* or R2_* credentials
- **Email**: EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD
- **Firebase** (optional): FIREBASE_* credentials

## Cron Jobs

The server automatically runs the following cleanup jobs:

1. **Expired Rooms Cleanup** - Every 12 hours (00:00 and 12:00)
   - Deletes rooms past their expiration time
   - Removes associated media from cloud storage

2. **Expired Portals Cleanup** - Every 48 hours (02:00 every 2 days)
   - Deletes portals past their expiration time
   - Removes associated media from cloud storage

3. **Inactive Participants Cleanup** - Every 6 hours
   - Removes disconnected socket connections from rooms

## Security Features

- Helmet.js for HTTP security headers
- CORS protection
- JWT token-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting ready (can be added)
- File type and size validation

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

ISC

## Support

For issues and questions, please open an issue in the repository.
```

```text file=".gitignore"
# Dependencies
node_modules/
package-lock.json
yarn.lock

# Environment variables
.env
.env.local
.env.production

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Temporary files
tmp/
temp/
uploads/

# Build files
dist/
build/

# Test coverage
coverage/
