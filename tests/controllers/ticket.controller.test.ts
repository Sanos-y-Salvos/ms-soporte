jest.mock('../../src/services/ticket.service');

import * as TicketService from '../../src/services/ticket.service';
import * as TicketController from '../../src/controllers/ticket.controller';
import { CategoriaTicket, EstadoTicket } from '../../src/models/Ticket';
import { TipoAutor } from '../../src/models/Comentario';

const mocked = TicketService as jest.Mocked<typeof TicketService>;

const buildRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('controllers/ticket.controller', () => {
  describe('crearTicket', () => {
    it('responde 400 si faltan campos', async () => {
      const req: any = { user: { id: 'u1' }, body: { asunto: 'a' } };
      const res = buildRes();
      await TicketController.crearTicket(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(mocked.crearTicket).not.toHaveBeenCalled();
    });

    it('crea el ticket y responde 201', async () => {
      mocked.crearTicket.mockResolvedValue({ id: 't1' } as any);
      const req: any = {
        user: { id: 'u1' },
        body: { categoria: CategoriaTicket.OTRO, asunto: 'a', descripcion: 'd' },
      };
      const res = buildRes();
      await TicketController.crearTicket(req, res);
      expect(mocked.crearTicket).toHaveBeenCalledWith('u1', CategoriaTicket.OTRO, 'a', 'd');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ ok: true, data: { id: 't1' } });
    });

    it('responde 400 si el servicio lanza error', async () => {
      mocked.crearTicket.mockRejectedValue(new Error('boom'));
      const req: any = {
        user: { id: 'u1' },
        body: { categoria: CategoriaTicket.OTRO, asunto: 'a', descripcion: 'd' },
      };
      const res = buildRes();
      await TicketController.crearTicket(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ ok: false, message: 'boom' });
    });
  });

  describe('misTickets', () => {
    it('responde con la lista del usuario', async () => {
      mocked.misTickets.mockResolvedValue([{ id: 't1' }] as any);
      const req: any = { user: { id: 'u1' } };
      const res = buildRes();
      await TicketController.misTickets(req, res);
      expect(mocked.misTickets).toHaveBeenCalledWith('u1');
      expect(res.json).toHaveBeenCalledWith({ ok: true, data: [{ id: 't1' }] });
    });

    it('propaga errores', async () => {
      mocked.misTickets.mockRejectedValue(new Error('x'));
      const req: any = { user: { id: 'u1' } };
      const res = buildRes();
      await TicketController.misTickets(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('verTicket', () => {
    it('retorna el ticket', async () => {
      mocked.verTicket.mockResolvedValue({ id: 't1' } as any);
      const req: any = { params: { id: 't1' } };
      const res = buildRes();
      await TicketController.verTicket(req, res);
      expect(mocked.verTicket).toHaveBeenCalledWith('t1');
      expect(res.json).toHaveBeenCalledWith({ ok: true, data: { id: 't1' } });
    });

    it('responde 404 si el servicio lanza', async () => {
      mocked.verTicket.mockRejectedValue(new Error('Ticket no encontrado'));
      const req: any = { params: { id: 'tx' } };
      const res = buildRes();
      await TicketController.verTicket(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('agregarComentario', () => {
    it('responde 400 si no hay contenido', async () => {
      const req: any = { user: { id: 'u1' }, params: { id: 't1' }, body: {} };
      const res = buildRes();
      await TicketController.agregarComentario(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('crea el comentario y responde 201', async () => {
      mocked.agregarComentario.mockResolvedValue({ id: 'c1' } as any);
      const req: any = { user: { id: 'u1' }, params: { id: 't1' }, body: { contenido: 'hola' } };
      const res = buildRes();
      await TicketController.agregarComentario(req, res);
      expect(mocked.agregarComentario).toHaveBeenCalledWith('t1', 'u1', TipoAutor.USUARIO, 'hola');
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('responde 400 ante error del servicio', async () => {
      mocked.agregarComentario.mockRejectedValue(new Error('bad'));
      const req: any = { user: { id: 'u1' }, params: { id: 't1' }, body: { contenido: 'x' } };
      const res = buildRes();
      await TicketController.agregarComentario(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('listarTickets', () => {
    it('lista sin filtro', async () => {
      mocked.listarTickets.mockResolvedValue([] as any);
      const req: any = { query: {} };
      const res = buildRes();
      await TicketController.listarTickets(req, res);
      expect(mocked.listarTickets).toHaveBeenCalledWith(undefined);
    });

    it('lista con filtro de estado', async () => {
      mocked.listarTickets.mockResolvedValue([] as any);
      const req: any = { query: { estado: EstadoTicket.ABIERTO } };
      const res = buildRes();
      await TicketController.listarTickets(req, res);
      expect(mocked.listarTickets).toHaveBeenCalledWith(EstadoTicket.ABIERTO);
    });

    it('propaga errores', async () => {
      mocked.listarTickets.mockRejectedValue(new Error('x'));
      const req: any = { query: {} };
      const res = buildRes();
      await TicketController.listarTickets(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('asignarTicket', () => {
    it('asigna y responde 200', async () => {
      mocked.asignarTicket.mockResolvedValue({ id: 't1' } as any);
      const req: any = { user: { id: 'admin1' }, params: { id: 't1' } };
      const res = buildRes();
      await TicketController.asignarTicket(req, res);
      expect(mocked.asignarTicket).toHaveBeenCalledWith('t1', 'admin1');
      expect(res.json).toHaveBeenCalledWith({ ok: true, data: { id: 't1' } });
    });

    it('responde 400 ante error', async () => {
      mocked.asignarTicket.mockRejectedValue(new Error('x'));
      const req: any = { user: { id: 'admin1' }, params: { id: 't1' } };
      const res = buildRes();
      await TicketController.asignarTicket(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('responderTicket', () => {
    it('responde 400 si falta contenido', async () => {
      const req: any = { user: { id: 'a1' }, params: { id: 't1' }, body: {} };
      const res = buildRes();
      await TicketController.responderTicket(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('responde 201 al crear comentario admin', async () => {
      mocked.responderTicket.mockResolvedValue({ id: 'c1' } as any);
      const req: any = { user: { id: 'a1' }, params: { id: 't1' }, body: { contenido: 'ok' } };
      const res = buildRes();
      await TicketController.responderTicket(req, res);
      expect(mocked.responderTicket).toHaveBeenCalledWith('t1', 'a1', 'ok');
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('propaga errores', async () => {
      mocked.responderTicket.mockRejectedValue(new Error('x'));
      const req: any = { user: { id: 'a1' }, params: { id: 't1' }, body: { contenido: 'ok' } };
      const res = buildRes();
      await TicketController.responderTicket(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('actualizarEstado', () => {
    it('responde 400 si falta estado', async () => {
      const req: any = { params: { id: 't1' }, body: {} };
      const res = buildRes();
      await TicketController.actualizarEstado(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('actualiza y responde 200', async () => {
      mocked.actualizarEstado.mockResolvedValue({ id: 't1', estado: EstadoTicket.RESUELTO } as any);
      const req: any = { params: { id: 't1' }, body: { estado: EstadoTicket.RESUELTO } };
      const res = buildRes();
      await TicketController.actualizarEstado(req, res);
      expect(mocked.actualizarEstado).toHaveBeenCalledWith('t1', EstadoTicket.RESUELTO);
      expect(res.json).toHaveBeenCalledWith({ ok: true, data: { id: 't1', estado: EstadoTicket.RESUELTO } });
    });

    it('propaga errores', async () => {
      mocked.actualizarEstado.mockRejectedValue(new Error('x'));
      const req: any = { params: { id: 't1' }, body: { estado: EstadoTicket.RESUELTO } };
      const res = buildRes();
      await TicketController.actualizarEstado(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('crearTicketPublico', () => {
    it('responde 400 si faltan email, categoría o descripción', async () => {
      const req: any = { body: { email: 'a@a.cl' } };
      const res = buildRes();
      await TicketController.crearTicketPublico(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('usa asunto por defecto para problema_tecnico', async () => {
      mocked.crearTicketPublico.mockResolvedValue({ id: 't1' } as any);
      const req: any = { body: { email: 'a@a.cl', categoria: 'problema_tecnico', descripcion: 'desc' } };
      const res = buildRes();
      await TicketController.crearTicketPublico(req, res);
      expect(mocked.crearTicketPublico).toHaveBeenCalledWith('a@a.cl', 'problema_tecnico', 'Problema técnico', 'desc');
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('usa asunto por defecto para reporte_abuso', async () => {
      mocked.crearTicketPublico.mockResolvedValue({ id: 't1' } as any);
      const req: any = { body: { email: 'a@a.cl', categoria: 'reporte_abuso', descripcion: 'desc' } };
      const res = buildRes();
      await TicketController.crearTicketPublico(req, res);
      expect(mocked.crearTicketPublico).toHaveBeenCalledWith('a@a.cl', 'reporte_abuso', 'Reporte de abuso', 'desc');
    });

    it('exige asunto para la categoría "otro"', async () => {
      const req: any = { body: { email: 'a@a.cl', categoria: 'otro', descripcion: 'desc' } };
      const res = buildRes();
      await TicketController.crearTicketPublico(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(mocked.crearTicketPublico).not.toHaveBeenCalled();
    });

    it('respeta el asunto enviado por el usuario', async () => {
      mocked.crearTicketPublico.mockResolvedValue({ id: 't1' } as any);
      const req: any = {
        body: { email: 'a@a.cl', categoria: 'otro', asunto: 'mi asunto', descripcion: 'desc' },
      };
      const res = buildRes();
      await TicketController.crearTicketPublico(req, res);
      expect(mocked.crearTicketPublico).toHaveBeenCalledWith('a@a.cl', 'otro', 'mi asunto', 'desc');
    });

    it('propaga errores del servicio', async () => {
      mocked.crearTicketPublico.mockRejectedValue(new Error('boom'));
      const req: any = {
        body: { email: 'a@a.cl', categoria: 'problema_tecnico', descripcion: 'desc' },
      };
      const res = buildRes();
      await TicketController.crearTicketPublico(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
