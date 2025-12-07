import { Server, Socket } from 'socket.io';
import { examRooms, studentSessions } from '../index.js';

interface JoinRoomData {
    examId: string;
    sessionId: string;
    studentId: string;
    studentName: string;
}

interface ViolationData {
    examId: string;
    studentId: string;
    type: string;
    description: string;
    timestamp: string;
}

export function setupExamNamespace(io: Server) {
    const examNamespace = io.of('/exam');

    examNamespace.on('connection', (socket: Socket) => {
        console.log(`📝 Student connected to /exam: ${socket.id}`);

        // Student joins an exam room
        socket.on('join-room', (data: JoinRoomData) => {
            const { examId, sessionId, studentId, studentName } = data;

            // Join the exam room
            socket.join(`exam:${examId}`);

            // Store student session
            studentSessions.set(socket.id, {
                examId,
                studentId,
                studentName,
                socketId: socket.id,
                joinedAt: new Date(),
            });

            // Track room members
            if (!examRooms.has(examId)) {
                examRooms.set(examId, new Set());
            }
            examRooms.get(examId)!.add(socket.id);

            console.log(`👤 Student ${studentName} joined exam ${examId}`);

            // Notify monitoring namespace
            io.of('/monitoring').to(`monitor:${examId}`).emit('student-joined', {
                studentId,
                studentName,
                socketId: socket.id,
                timestamp: new Date().toISOString(),
            });
        });

        // Student leaves exam
        socket.on('leave-room', (data: { examId: string }) => {
            const session = studentSessions.get(socket.id);
            if (session) {
                socket.leave(`exam:${data.examId}`);
                examRooms.get(data.examId)?.delete(socket.id);

                // Notify monitoring
                io.of('/monitoring').to(`monitor:${data.examId}`).emit('student-left', {
                    studentId: session.studentId,
                    studentName: session.studentName,
                    timestamp: new Date().toISOString(),
                });

                studentSessions.delete(socket.id);
                console.log(`👋 Student ${session.studentName} left exam ${data.examId}`);
            }
        });

        // Student reports violation
        socket.on('violation', (data: ViolationData) => {
            console.log(`⚠️ Violation from ${data.studentId}: ${data.type}`);

            // Forward to monitoring
            io.of('/monitoring').to(`monitor:${data.examId}`).emit('violation-alert', {
                ...data,
                socketId: socket.id,
            });
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            const session = studentSessions.get(socket.id);
            if (session) {
                examRooms.get(session.examId)?.delete(socket.id);

                // Notify monitoring
                io.of('/monitoring').to(`monitor:${session.examId}`).emit('student-disconnected', {
                    studentId: session.studentId,
                    studentName: session.studentName,
                    timestamp: new Date().toISOString(),
                });

                studentSessions.delete(socket.id);
            }
        });
    });

    console.log('✅ Exam namespace initialized');
}
