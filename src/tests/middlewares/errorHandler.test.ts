import { errorHandler } from '../../middlewares/errorHandler';

describe('middlewares/errorHandler', () => {
  it('responde 500 y oculta el detalle', () => {
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    errorHandler(new Error('boom'), {} as any, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ ok: false, message: 'Error interno del servidor' });
    spy.mockRestore();
  });
});
