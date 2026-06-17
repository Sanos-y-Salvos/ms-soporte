import { successResponse, errorResponse } from '../../src/utils/response';

const buildRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('utils/response', () => {
  describe('successResponse', () => {
    it('responde con status 200 por defecto y ok:true', () => {
      const res = buildRes();
      const data = { foo: 'bar' };
      successResponse(res, data);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ ok: true, data });
    });

    it('respeta el status personalizado', () => {
      const res = buildRes();
      successResponse(res, { id: 1 }, 201);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ ok: true, data: { id: 1 } });
    });
  });

  describe('errorResponse', () => {
    it('responde con status 400 por defecto y ok:false', () => {
      const res = buildRes();
      errorResponse(res, 'error');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ ok: false, message: 'error' });
    });

    it('respeta el status personalizado', () => {
      const res = buildRes();
      errorResponse(res, 'no encontrado', 404);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ ok: false, message: 'no encontrado' });
    });
  });
});
