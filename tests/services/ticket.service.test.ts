import axios from 'axios';

const ticketRepoMock = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
};
const comentarioRepoMock = {
  create: jest.fn(),
  save: jest.fn(),
};
const dbQueryMock = jest.fn();

jest.mock('../../src/config/db', () => ({
  AppDataSource: {
    getRepository: jest.fn((entity: any) => {
      const name = entity?.name ?? entity;
      if (name === 'Ticket') return ticketRepoMock;
      if (name === 'Comentario') return comentarioRepoMock;
      return ticketRepoMock;
    }),
    query: (...args: any[]) => dbQueryMock(...args),
  },
}));

jest.mock('axios');
jest.mock('../../src/utils/email');

import * as TicketService from '../../src/services/ticket.service';
import * as EmailUtils from '../../src/utils/email';

const mockedEmail = EmailUtils as jest.Mocked<typeof EmailUtils>;
import { EstadoTicket, CategoriaTicket } from '../../src/models/Ticket';
import { TipoAutor } from '../../src/models/Comentario';

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('services/ticket.service', () => {
  describe('crearTicket', () => {
    it('crea y guarda un ticket con los datos recibidos', async () => {
      const draft = { user_id: 'u1', categoria: CategoriaTicket.OTRO, asunto: 'a', descripcion: 'd' };
      const saved = { id: 't1', ...draft };
      ticketRepoMock.create.mockReturnValue(draft);
      ticketRepoMock.save.mockResolvedValue(saved);

      const result = await TicketService.crearTicket('u1', CategoriaTicket.OTRO, 'a', 'd');

      expect(ticketRepoMock.create).toHaveBeenCalledWith(draft);
      expect(ticketRepoMock.save).toHaveBeenCalledWith(draft);
      expect(result).toEqual(saved);
    });
  });

  describe('misTickets', () => {
    it('busca por user_id ordenado descendente con comentarios', async () => {
      const lista = [{ id: 't1' }];
      ticketRepoMock.find.mockResolvedValue(lista);

      const result = await TicketService.misTickets('u1');

      expect(ticketRepoMock.find).toHaveBeenCalledWith({
        where: { user_id: 'u1' },
        relations: ['comentarios'],
        order: { created_at: 'DESC' },
      });
      expect(result).toBe(lista);
    });
  });

  describe('agregarComentario', () => {
    it('lanza error si el ticket no existe', async () => {
      ticketRepoMock.findOne.mockResolvedValue(null);
      await expect(
        TicketService.agregarComentario('tX', 'u1', TipoAutor.USUARIO, 'hola')
      ).rejects.toThrow('Ticket no encontrado');
    });

    it('lanza error si el ticket está cerrado', async () => {
      ticketRepoMock.findOne.mockResolvedValue({ id: 't1', estado: EstadoTicket.CERRADO });
      await expect(
        TicketService.agregarComentario('t1', 'u1', TipoAutor.USUARIO, 'x')
      ).rejects.toThrow('No se puede comentar un ticket cerrado');
    });

    it('crea y guarda un comentario válido', async () => {
      const ticket = { id: 't1', estado: EstadoTicket.ABIERTO };
      ticketRepoMock.findOne.mockResolvedValue(ticket);
      const draft = { ticket, autor_id: 'u1', tipo_autor: TipoAutor.USUARIO, contenido: 'ok' };
      comentarioRepoMock.create.mockReturnValue(draft);
      comentarioRepoMock.save.mockResolvedValue({ id: 'c1', ...draft });

      const result = await TicketService.agregarComentario('t1', 'u1', TipoAutor.USUARIO, 'ok');

      expect(comentarioRepoMock.create).toHaveBeenCalledWith(draft);
      expect(result).toEqual({ id: 'c1', ...draft });
    });
  });

  describe('listarTickets', () => {
    it('lista todos los tickets sin filtro', async () => {
      ticketRepoMock.find.mockResolvedValue([]);
      await TicketService.listarTickets();
      expect(ticketRepoMock.find).toHaveBeenCalledWith({
        where: {},
        relations: ['comentarios'],
        order: { created_at: 'DESC' },
      });
    });

    it('lista filtrando por estado', async () => {
      ticketRepoMock.find.mockResolvedValue([]);
      await TicketService.listarTickets(EstadoTicket.ABIERTO);
      expect(ticketRepoMock.find).toHaveBeenCalledWith({
        where: { estado: EstadoTicket.ABIERTO },
        relations: ['comentarios'],
        order: { created_at: 'DESC' },
      });
    });
  });

  describe('asignarTicket', () => {
    it('lanza error si no existe el ticket', async () => {
      ticketRepoMock.findOne.mockResolvedValue(null);
      await expect(TicketService.asignarTicket('tX', 'admin1')).rejects.toThrow('Ticket no encontrado');
    });

    it('actualiza el ticket con admin y estado en_proceso', async () => {
      const ticket = { id: 't1' };
      const updated = { id: 't1', asignado_a: 'admin1', estado: EstadoTicket.EN_PROCESO };
      ticketRepoMock.findOne.mockResolvedValueOnce(ticket).mockResolvedValueOnce(updated);
      ticketRepoMock.update.mockResolvedValue({});

      const result = await TicketService.asignarTicket('t1', 'admin1');

      expect(ticketRepoMock.update).toHaveBeenCalledWith(
        { id: 't1' },
        { asignado_a: 'admin1', estado: EstadoTicket.EN_PROCESO }
      );
      expect(result).toEqual(updated);
    });
  });

  describe('responderTicket', () => {
    beforeEach(() => {
      mockedEmail.enviarRespuestaTicket.mockResolvedValue(undefined);
    });

    it('agrega comentario como administrador', async () => {
      const ticket = { id: 't1', estado: EstadoTicket.ABIERTO };
      ticketRepoMock.findOne.mockResolvedValue(ticket);
      comentarioRepoMock.create.mockReturnValue({ contenido: 'resp' });
      comentarioRepoMock.save.mockResolvedValue({ id: 'c1', contenido: 'resp' });

      await TicketService.responderTicket('t1', 'admin1', 'resp');

      expect(comentarioRepoMock.create).toHaveBeenCalledWith({
        ticket,
        autor_id: 'admin1',
        tipo_autor: TipoAutor.ADMINISTRADOR,
        contenido: 'resp',
      });
    });

    it('envía email si el ticket no tiene user_id pero sí email_contacto', async () => {
      const ticket = { id: 't1', estado: EstadoTicket.ABIERTO, user_id: null, email_contacto: 'x@x.cl', asunto: 'Asunto' };
      ticketRepoMock.findOne.mockResolvedValue(ticket);
      comentarioRepoMock.create.mockReturnValue({});
      comentarioRepoMock.save.mockResolvedValue({ id: 'c1' });

      await TicketService.responderTicket('t1', 'admin1', 'hola');

      expect(mockedEmail.enviarRespuestaTicket).toHaveBeenCalledWith('x@x.cl', 't1', 'Asunto', 'hola');
    });

    it('no envía email si el ticket tiene user_id', async () => {
      const ticket = { id: 't1', estado: EstadoTicket.ABIERTO, user_id: 'u1', email_contacto: 'x@x.cl' };
      ticketRepoMock.findOne.mockResolvedValue(ticket);
      comentarioRepoMock.create.mockReturnValue({});
      comentarioRepoMock.save.mockResolvedValue({ id: 'c1' });

      await TicketService.responderTicket('t1', 'admin1', 'hola');

      expect(mockedEmail.enviarRespuestaTicket).not.toHaveBeenCalled();
    });

    it('no bloquea la respuesta si el envío de email falla', async () => {
      const ticket = { id: 't1', estado: EstadoTicket.ABIERTO, user_id: null, email_contacto: 'x@x.cl', asunto: 'A' };
      ticketRepoMock.findOne.mockResolvedValue(ticket);
      comentarioRepoMock.create.mockReturnValue({});
      comentarioRepoMock.save.mockResolvedValue({ id: 'c1' });
      mockedEmail.enviarRespuestaTicket.mockRejectedValue(new Error('smtp down'));

      await expect(TicketService.responderTicket('t1', 'admin1', 'hola')).resolves.toEqual({ id: 'c1' });
    });

    it('lanza error si el ticket no existe', async () => {
      ticketRepoMock.findOne.mockResolvedValue(null);
      await expect(TicketService.responderTicket('tX', 'admin1', 'resp')).rejects.toThrow('Ticket no encontrado');
    });
  });

  describe('actualizarEstado', () => {
    it('lanza error si no existe', async () => {
      ticketRepoMock.findOne.mockResolvedValue(null);
      await expect(
        TicketService.actualizarEstado('tX', EstadoTicket.RESUELTO)
      ).rejects.toThrow('Ticket no encontrado');
    });

    it('actualiza el estado del ticket', async () => {
      const ticket = { id: 't1' };
      const updated = { id: 't1', estado: EstadoTicket.RESUELTO };
      ticketRepoMock.findOne.mockResolvedValueOnce(ticket).mockResolvedValueOnce(updated);

      const result = await TicketService.actualizarEstado('t1', EstadoTicket.RESUELTO);

      expect(ticketRepoMock.update).toHaveBeenCalledWith({ id: 't1' }, { estado: EstadoTicket.RESUELTO });
      expect(result).toEqual(updated);
    });
  });

  describe('verTicket', () => {
    it('lanza error si no existe', async () => {
      ticketRepoMock.findOne.mockResolvedValue(null);
      await expect(TicketService.verTicket('tX')).rejects.toThrow('Ticket no encontrado');
    });

    it('retorna el ticket con comentarios', async () => {
      const ticket = { id: 't1', comentarios: [] };
      ticketRepoMock.findOne.mockResolvedValue(ticket);
      const result = await TicketService.verTicket('t1');
      expect(result).toBe(ticket);
    });
  });

  describe('getEstadisticas', () => {
    it('retorna resumen por estado, categoría, mes y tiempo de resolución', async () => {
      dbQueryMock
        .mockResolvedValueOnce([{ count: 10 }])
        .mockResolvedValueOnce([{ estado: 'abierto', count: 4 }, { estado: 'resuelto', count: 6 }])
        .mockResolvedValueOnce([{ categoria: 'otro', count: 10 }])
        .mockResolvedValueOnce([{ mes: '2024-01', count: 10 }])
        .mockResolvedValueOnce([{ mes: '2024-01', categoria: 'otro', count: 10 }])
        .mockResolvedValueOnce([{ categoria: 'otro', dias_promedio: 2.5 }]);

      const result = await TicketService.getEstadisticas();

      expect(result.total).toBe(10);
      expect(result.por_estado).toEqual([
        { estado: 'abierto',    count: 4 },
        { estado: 'en_proceso', count: 0 },
        { estado: 'resuelto',   count: 6 },
        { estado: 'cerrado',    count: 0 },
      ]);
      expect(result.por_categoria).toEqual([
        { categoria: 'problema_tecnico', count: 0  },
        { categoria: 'reporte_abuso',    count: 0  },
        { categoria: 'otro',             count: 10 },
      ]);
      expect(result.por_mes).toEqual([{ mes: '2024-01', count: 10 }]);
      expect(result.por_mes_categoria).toEqual([{ mes: '2024-01', categoria: 'otro', count: 10 }]);
      expect(result.tiempo_resolucion).toEqual([{ categoria: 'otro', dias_promedio: 2.5 }]);
      expect(dbQueryMock).toHaveBeenCalledTimes(6);
    });
  });

  describe('crearTicketPublico', () => {
    const originalEnv = process.env;
    beforeEach(() => {
      process.env = { ...originalEnv, MS_AUTH_URL: 'http://auth.test', INTERNAL_API_KEY: 'k' };
    });
    afterAll(() => { process.env = originalEnv; });

    it('vincula con user_id cuando ms-auth devuelve un usuario', async () => {
      mockedAxios.post.mockResolvedValue({ data: { data: { id: 'u-99' } } });
      ticketRepoMock.create.mockImplementation((d) => d);
      ticketRepoMock.save.mockImplementation(async (d) => ({ id: 't1', ...d }));

      const result = await TicketService.crearTicketPublico(
        'A@Mail.CL',
        CategoriaTicket.OTRO,
        'asunto',
        'desc'
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://auth.test/api/auth/interno/por-email',
        { email: 'A@Mail.CL' },
        expect.objectContaining({ headers: { 'x-api-key': 'k' }, timeout: 3000 })
      );
      expect(ticketRepoMock.create).toHaveBeenCalledWith({
        user_id: 'u-99',
        email_contacto: 'a@mail.cl',
        categoria: CategoriaTicket.OTRO,
        asunto: 'asunto',
        descripcion: 'desc',
      });
      expect(result).toMatchObject({ id: 't1', user_id: 'u-99' });
    });

    it('crea ticket anónimo si axios falla', async () => {
      mockedAxios.post.mockRejectedValue(new Error('down'));
      ticketRepoMock.create.mockImplementation((d) => d);
      ticketRepoMock.save.mockImplementation(async (d) => ({ id: 't2', ...d }));

      const result = await TicketService.crearTicketPublico(
        'b@b.cl',
        CategoriaTicket.PROBLEMA_TECNICO,
        'a',
        'd'
      );

      expect(ticketRepoMock.create).toHaveBeenCalledWith({
        user_id: undefined,
        email_contacto: 'b@b.cl',
        categoria: CategoriaTicket.PROBLEMA_TECNICO,
        asunto: 'a',
        descripcion: 'd',
      });
      expect(result).toMatchObject({ id: 't2' });
    });

    it('crea ticket anónimo si la respuesta no trae id', async () => {
      mockedAxios.post.mockResolvedValue({ data: {} });
      ticketRepoMock.create.mockImplementation((d) => d);
      ticketRepoMock.save.mockImplementation(async (d) => ({ id: 't3', ...d }));

      await TicketService.crearTicketPublico('c@c.cl', CategoriaTicket.OTRO, 'a', 'd');

      expect(ticketRepoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: undefined, email_contacto: 'c@c.cl' })
      );
    });

    it('usa valores por defecto si MS_AUTH_URL e INTERNAL_API_KEY no están definidos', async () => {
      process.env = { ...originalEnv };
      delete process.env.MS_AUTH_URL;
      delete process.env.INTERNAL_API_KEY;
      mockedAxios.post.mockResolvedValue({ data: { data: { id: 'u1' } } });
      ticketRepoMock.create.mockImplementation((d) => d);
      ticketRepoMock.save.mockImplementation(async (d) => ({ id: 't4', ...d }));

      await TicketService.crearTicketPublico('d@d.cl', CategoriaTicket.OTRO, 'a', 'd');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3001/api/auth/interno/por-email',
        { email: 'd@d.cl' },
        expect.objectContaining({ headers: { 'x-api-key': '' } })
      );
    });
  });
});
