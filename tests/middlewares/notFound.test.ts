import { notFound } from '../../src/middlewares/notFound';

describe('middlewares/notFound', () => {
  it('responde 404 con el mensaje estándar', () => {
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    notFound({} as any, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ ok: false, message: 'Ruta no encontrada' });
  });
});
