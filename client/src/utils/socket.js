import { io } from 'socket.io-client';

const socketURL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : window.location.origin;

export const socket = io(socketURL, {
  transports: ['polling', 'websocket'], // Matching backend
  withCredentials: true
});
