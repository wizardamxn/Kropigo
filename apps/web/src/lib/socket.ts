import { io as socketIo, Socket } from 'socket.io-client';
import { SOCKET_URL } from '@/lib/config';

let socket: Socket | null = null;

/**
 * Singleton socket connection.
 * The backend authenticates via the httpOnly cookie sent automatically with
 * the WebSocket handshake when withCredentials is true.
 * No need to pass a token explicitly.
 */
export const getSocket = (): Socket => {
  if (!socket) {
    socket = socketIo(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
