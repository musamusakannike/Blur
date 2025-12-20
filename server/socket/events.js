/**
 * Socket.IO Event Names
 * Centralized event names for consistency
 */

export const SOCKET_EVENTS = {
  // Connection
  CONNECTION: "connection",
  DISCONNECT: "disconnect",

  // Room events
  ROOM_JOIN: "room:join",
  ROOM_JOINED: "room:joined",
  ROOM_LEAVE: "room:leave",
  ROOM_ERROR: "room:error",
  ROOM_DELETED: "room:deleted",
  ROOM_UPDATED: "room:updated",
  ROOM_PARTICIPANT_JOINED: "room:participant-joined",
  ROOM_PARTICIPANT_LEFT: "room:participant-left",

  // Message events
  ROOM_MESSAGE: "room:message",
  ROOM_NEW_MESSAGE: "room:new-message",
  ROOM_TYPING: "room:typing",
  ROOM_USER_TYPING: "room:user-typing",

  // Portal events
  PORTAL_MESSAGE: "portal:message",
  PORTAL_NEW_MESSAGE: "portal:new-message",
  PORTAL_ERROR: "portal:error",
  PORTAL_DELETED: "portal:deleted",
}
