import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

let socket: Socket | null = null;

export const initSocket = (token?: string): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: {
        token: token || '',
      },
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
