import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from './config/env';

let io: SocketIOServer | null = null;

export function initSocket(httpServer: HttpServer): SocketIOServer {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    // JWT auth middleware for every socket connection
    io.use((socket: Socket, next) => {
        const token = socket.handshake.auth?.token as string | undefined;
        if (!token) return next(new Error('Authentication required'));
        try {
            const decoded = jwt.verify(token, config.jwtAccessSecret) as { id: string };
            (socket as any).userId = decoded.id;
            next();
        } catch {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket: Socket) => {
        const userId = (socket as any).userId as string;
        // Place user in their private room
        socket.join(`user:${userId}`);
        console.log(`[Socket] User ${userId} connected (${socket.id})`);

        socket.on('disconnect', () => {
            console.log(`[Socket] User ${userId} disconnected (${socket.id})`);
        });
    });

    return io;
}

/**
 * Emit a real-time event to a specific user's private room.
 * @param userId  MongoDB User._id (string)
 * @param event   Event name
 * @param data    Payload
 */
export function emitToUser(userId: string, event: string, data: unknown): void {
    if (!io) return;
    io.to(`user:${userId}`).emit(event, data);
}

/**
 * Broadcast to ALL connected users (use sparingly).
 */
export function broadcast(event: string, data: unknown): void {
    if (!io) return;
    io.emit(event, data);
}
