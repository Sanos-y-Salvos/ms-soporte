import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface SocketUsuario { id: string; email: string; role: string; }

export function setupTicketSocket(io: Server) {
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers?.authorization as string | undefined)?.replace('Bearer ', '');
    if (!token) return next(new Error('Token requerido'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as SocketUsuario;
      (socket as any).usuario = decoded;
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket: Socket) => {
    socket.on('join_ticket', (ticketId: string) => {
      socket.join(`ticket:${ticketId}`);
    });

    socket.on('leave_ticket', (ticketId: string) => {
      socket.leave(`ticket:${ticketId}`);
    });
  });
}
