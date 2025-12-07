import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupExamNamespace } from './namespaces/exam.js';
import { setupMonitoringNamespace } from './namespaces/monitoring.js';

dotenv.config();

const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Create HTTP server
const httpServer = createServer();

// Create Socket.IO server
const io = new Server(httpServer, {
    cors: {
        origin: CORS_ORIGIN.split(','),
        methods: ['GET', 'POST'],
        credentials: true,
    },
    transports: ['websocket', 'polling'],
});

// Store for exam rooms
export const examRooms = new Map<string, Set<string>>();
export const studentSessions = new Map<string, {
    examId: string;
    studentId: string;
    studentName: string;
    socketId: string;
    joinedAt: Date;
}>();

// Setup namespaces
setupExamNamespace(io);
setupMonitoringNamespace(io);

// Connection logging
io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('disconnect', (reason) => {
        console.log(`❌ Client disconnected: ${socket.id} - ${reason}`);
        // Clean up student session
        studentSessions.delete(socket.id);
    });
});

// Start server
httpServer.listen(PORT, () => {
    console.log(`
🚀 SecureExam Socket Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Port: ${PORT}
🌐 CORS: ${CORS_ORIGIN}
⏰ Started: ${new Date().toISOString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
});

export { io };
