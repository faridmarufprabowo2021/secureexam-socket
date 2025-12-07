import { Server, Socket } from 'socket.io';
import { examRooms, studentSessions } from '../index.js';

interface BroadcastData {
    examId: string;
    message: string;
    teacherName: string;
}

interface KickData {
    examId: string;
    studentId: string;
    socketId: string;
    reason?: string;
}

interface BlockData {
    examId: string;
    studentId: string;
    socketId: string;
}

export function setupMonitoringNamespace(io: Server) {
    const monitoringNamespace = io.of('/monitoring');

    monitoringNamespace.on('connection', (socket: Socket) => {
        console.log(`👨‍🏫 Teacher connected to /monitoring: ${socket.id}`);

        // Teacher subscribes to an exam's events
        socket.on('subscribe-exam', (data: { examId: string }) => {
            socket.join(`monitor:${data.examId}`);
            console.log(`👁️ Teacher subscribed to exam ${data.examId}`);

            // Send current students list
            const students: any[] = [];
            studentSessions.forEach((session, socketId) => {
                if (session.examId === data.examId) {
                    students.push({
                        ...session,
                        socketId,
                    });
                }
            });

            socket.emit('current-students', { students });
        });

        // Teacher unsubscribes from exam
        socket.on('unsubscribe-exam', (data: { examId: string }) => {
            socket.leave(`monitor:${data.examId}`);
            console.log(`🚪 Teacher unsubscribed from exam ${data.examId}`);
        });

        // Teacher sends broadcast message
        socket.on('send-broadcast', (data: BroadcastData) => {
            console.log(`📢 Broadcast to exam ${data.examId}: ${data.message}`);

            // Send to all students in the exam
            io.of('/exam').to(`exam:${data.examId}`).emit('broadcast', {
                message: data.message,
                from: data.teacherName,
                timestamp: new Date().toISOString(),
            });

            // Confirm to teacher
            socket.emit('broadcast-sent', {
                examId: data.examId,
                recipientCount: examRooms.get(data.examId)?.size || 0,
            });
        });

        // Teacher kicks a student
        socket.on('kick-student', (data: KickData) => {
            console.log(`🦶 Kicking student ${data.studentId} from exam ${data.examId}`);

            // Notify the specific student
            io.of('/exam').to(data.socketId).emit('kicked', {
                reason: data.reason || 'Anda telah dikeluarkan dari ujian oleh pengawas',
                timestamp: new Date().toISOString(),
            });

            // Remove from room
            const studentSocket = io.of('/exam').sockets.get(data.socketId);
            if (studentSocket) {
                studentSocket.leave(`exam:${data.examId}`);
                studentSocket.disconnect(true);
            }

            // Confirm to teacher
            socket.emit('student-kicked', {
                studentId: data.studentId,
                success: true,
            });
        });

        // Teacher blocks a student
        socket.on('block-student', (data: BlockData) => {
            console.log(`🚫 Blocking student ${data.studentId} from exam ${data.examId}`);

            // Notify the specific student
            io.of('/exam').to(data.socketId).emit('blocked', {
                reason: 'Anda telah diblokir dari ujian oleh pengawas',
                timestamp: new Date().toISOString(),
            });

            // Remove and disconnect
            const studentSocket = io.of('/exam').sockets.get(data.socketId);
            if (studentSocket) {
                studentSocket.leave(`exam:${data.examId}`);
                studentSocket.disconnect(true);
            }

            // Confirm to teacher
            socket.emit('student-blocked', {
                studentId: data.studentId,
                success: true,
            });
        });

        // Teacher restores a student (unblock/unkick)
        socket.on('restore-student', (data: { examId: string; studentId: string }) => {
            console.log(`✅ Restoring student ${data.studentId} for exam ${data.examId}`);

            // This is handled by database in Next.js, just confirm
            socket.emit('student-restored', {
                studentId: data.studentId,
                success: true,
            });
        });

        // Get real-time stats
        socket.on('get-stats', (data: { examId: string }) => {
            const roomMembers = examRooms.get(data.examId)?.size || 0;

            socket.emit('stats-update', {
                examId: data.examId,
                activeStudents: roomMembers,
                timestamp: new Date().toISOString(),
            });
        });
    });

    console.log('✅ Monitoring namespace initialized');
}
