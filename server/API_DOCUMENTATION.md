# Blur API Documentation

Complete API documentation for the Blur anonymous social media platform.

## Base URL

```md
http://localhost:5000/api
```

## Authentication

Most authenticated endpoints require a Bearer token in the Authorization header:

```md
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow this format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "errors": []
}
```

## Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
```

**Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "displayName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "username": "johndoe",
    "email": "john@example.com",
    "displayName": "John Doe",
    "avatar": null,
    "isVerified": false
  }
}
```

#### Login
```http
POST /api/auth/login
```

**Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

---

### Rooms

#### Create Room
```http
POST /api/rooms
Authorization: Bearer <token>
```

**Body:**
```json
{
  "name": "My Chat Room",
  "description": "A place to chat anonymously",
  "lifetime": 3,
  "allowMedia": true,
  "maxMessageLength": 2000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Room created successfully",
  "room": {
    "id": "room-id",
    "code": "ABC123",
    "name": "My Chat Room",
    "description": "A place to chat anonymously",
    "creatorUsername": "johndoe",
    "expiresAt": "2024-01-01T15:00:00.000Z",
    "lifetime": 3,
    "settings": {
      "allowMedia": true,
      "maxMessageLength": 2000
    },
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### Get Room by Code
```http
GET /api/rooms/:code
```

#### Get Room Messages
```http
GET /api/rooms/:code/messages?page=1&limit=50
```

---

### Portals

#### Create Portal
```http
POST /api/portals
Authorization: Bearer <token>
```

**Body:**
```json
{
  "name": "Anonymous Feedback",
  "description": "Submit your feedback anonymously",
  "lifetime": 24,
  "allowMedia": true,
  "requireModeration": false
}
```

#### Submit Message to Portal
```http
POST /api/portals/:code/messages
```

**Body:**
```json
{
  "content": "This is an anonymous message",
  "type": "text"
}
```

---

### File Upload

#### Upload Single File
```http
POST /api/upload
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: File to upload

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "url": "https://storage.example.com/file.jpg",
    "publicId": "blur/media/file-id",
    "size": 123456,
    "format": "jpg",
    "type": "image"
  }
}
```

---

### Socket.IO

#### Connect to Socket
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-jwt-token' // Optional
  }
});
```

#### Join Room
```javascript
socket.emit('room:join', { roomCode: 'ABC123' });

socket.on('room:joined', (data) => {
  console.log('Joined room:', data);
});

socket.on('room:error', (error) => {
  console.error('Error:', error);
});
```

#### Send Message
```javascript
socket.emit('room:message', {
  roomCode: 'ABC123',
  content: 'Hello everyone!',
  type: 'text'
});

socket.on('room:new-message', (message) => {
  console.log('New message:', message);
});
```

## Rate Limiting

Currently not implemented but recommended for production:

- Authentication endpoints: 5 requests per minute
- Room/Portal creation: 10 per hour per user
- File uploads: 20 per hour per user

## Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `410` - Gone (expired resource)
- `500` - Internal Server Error

## Best Practices

1. Always validate user input on the client side
2. Handle socket disconnections gracefully
3. Implement exponential backoff for reconnection
4. Cache room/portal data to reduce API calls
5. Compress images before uploading
6. Handle file upload errors properly
