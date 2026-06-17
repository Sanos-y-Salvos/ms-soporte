import jwt from 'jsonwebtoken';
import { verifyToken, soloAdmin, AuthRequest } from '../../src/middlewares/verifyToken';

jest.mock('jsonwebtoken');

const buildRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('middlewares/verifyToken', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'secret';
  });

  describe('verifyToken', () => {
    it('responde 401 si no hay token', () => {
      const req = { headers: {} } as AuthRequest;
      const res = buildRes();
      const next = jest.fn();

      verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ ok: false, message: 'Token requerido' });
      expect(next).not.toHaveBeenCalled();
    });

    it('asigna el usuario y llama next() si el token es válido', () => {
      const payload = { id: 'u1', email: 'a@a.cl', role: 'usuario' };
      (jwt.verify as jest.Mock).mockReturnValue(payload);

      const req = { headers: { authorization: 'Bearer good' } } as AuthRequest;
      const res = buildRes();
      const next = jest.fn();

      verifyToken(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('good', 'secret');
      expect(req.user).toEqual(payload);
      expect(next).toHaveBeenCalled();
    });

    it('responde 403 si el token es inválido', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('bad'); });
      const req = { headers: { authorization: 'Bearer bad' } } as AuthRequest;
      const res = buildRes();
      const next = jest.fn();

      verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ ok: false, message: 'Token inválido o expirado' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('soloAdmin', () => {
    it('permite el paso de administrador', () => {
      const req = { user: { id: '1', email: 'a@a.cl', role: 'administrador' } } as AuthRequest;
      const res = buildRes();
      const next = jest.fn();

      soloAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('permite el paso de superadmin', () => {
      const req = { user: { id: '1', email: 'a@a.cl', role: 'superadmin' } } as AuthRequest;
      const res = buildRes();
      const next = jest.fn();

      soloAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('rechaza con 403 a un usuario sin rol permitido', () => {
      const req = { user: { id: '1', email: 'a@a.cl', role: 'usuario' } } as AuthRequest;
      const res = buildRes();
      const next = jest.fn();

      soloAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ ok: false, message: 'Acceso denegado' });
      expect(next).not.toHaveBeenCalled();
    });

    it('rechaza con 403 si no hay user', () => {
      const req = {} as AuthRequest;
      const res = buildRes();
      const next = jest.fn();

      soloAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
