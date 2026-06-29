import jwt from 'jsonwebtoken';
import { setupTicketSocket } from '../../socket/ticketHandler';

const buildSocket = (token?: string, authHeader?: string) => {
  const socket: any = {
    handshake: {
      auth: token !== undefined ? { token } : {},
      headers: authHeader ? { authorization: authHeader } : {},
    },
    on: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
    usuario: undefined,
  };
  return socket;
};

const buildIo = () => {
  let middlewareFn: Function;
  let connectionCb: Function;
  const io: any = {
    use: jest.fn((fn) => { middlewareFn = fn; }),
    on: jest.fn((event, cb) => { if (event === 'connection') connectionCb = cb; }),
    _callMiddleware: (socket: any) =>
      new Promise<void>((resolve, reject) => {
        middlewareFn(socket, (err?: Error) => (err ? reject(err) : resolve()));
      }),
    _connect: (socket: any) => connectionCb(socket),
  };
  return io;
};

describe('socket/ticketHandler', () => {
  const JWT_SECRET = 'test-secret';

  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  describe('middleware de autenticación', () => {
    it('llama next con error si no hay token', async () => {
      const io = buildIo();
      setupTicketSocket(io);
      const socket = buildSocket(undefined);
      await expect(io._callMiddleware(socket)).rejects.toThrow('Token requerido');
    });

    it('autentica con token en handshake.auth', async () => {
      const io = buildIo();
      setupTicketSocket(io);
      const payload = { id: 'u1', email: 'a@a.cl', role: 'usuario' };
      const token = jwt.sign(payload, JWT_SECRET);
      const socket = buildSocket(token);
      await io._callMiddleware(socket);
      expect(socket.usuario).toMatchObject(payload);
    });

    it('autentica con token en header Authorization', async () => {
      const io = buildIo();
      setupTicketSocket(io);
      const payload = { id: 'u1', email: 'a@a.cl', role: 'usuario' };
      const token = jwt.sign(payload, JWT_SECRET);
      const socket = buildSocket(undefined, `Bearer ${token}`);
      await io._callMiddleware(socket);
      expect(socket.usuario).toMatchObject(payload);
    });

    it('llama next con error si el token es inválido', async () => {
      const io = buildIo();
      setupTicketSocket(io);
      const socket = buildSocket('token-invalido');
      await expect(io._callMiddleware(socket)).rejects.toThrow('Token inválido');
    });
  });

  describe('eventos de conexión', () => {
    it('join_ticket une el socket a la sala correcta', () => {
      const io = buildIo();
      setupTicketSocket(io);
      const socket = buildSocket();
      io._connect(socket);
      const joinCb = socket.on.mock.calls.find(([e]: [string]) => e === 'join_ticket')[1];
      joinCb('t42');
      expect(socket.join).toHaveBeenCalledWith('ticket:t42');
    });

    it('leave_ticket saca el socket de la sala', () => {
      const io = buildIo();
      setupTicketSocket(io);
      const socket = buildSocket();
      io._connect(socket);
      const leaveCb = socket.on.mock.calls.find(([e]: [string]) => e === 'leave_ticket')[1];
      leaveCb('t42');
      expect(socket.leave).toHaveBeenCalledWith('ticket:t42');
    });
  });
});
