import { io, Socket } from 'socket.io-client';

// Socket server URL — same host as API but without /api suffix
const SOCKET_URL = 'http://10.207.37.219:5000';

let socket: Socket | null = null;

/**
 * Connect to (or retrieve existing) socket, authenticated with the access token.
 */
export function connectSocket(token: string): Socket {
    if (socket && socket.connected) return socket;

    // Disconnect stale socket before creating a new one
    if (socket) {
        socket.disconnect();
        socket = null;
    }

    socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
    });

    return socket;
}

/** Disconnect and clear the singleton. */
export function disconnectSocket(): void {
    socket?.disconnect();
    socket = null;
}

/** Get socket instance (null if not connected). */
export function getSocket(): Socket | null {
    return socket;
}
