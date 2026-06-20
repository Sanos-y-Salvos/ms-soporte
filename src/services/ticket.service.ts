import axios from 'axios';
import { AppDataSource } from '../config/db';
import { Ticket, EstadoTicket, CategoriaTicket } from '../models/Ticket';
import { Comentario, TipoAutor } from '../models/Comentario';
import { enviarRespuestaTicket } from '../utils/email';

const ticketRepo = () => AppDataSource.getRepository(Ticket);
const comentarioRepo = () => AppDataSource.getRepository(Comentario);

// RF-40 — Crear ticket
export const crearTicket = async (
  userId: string,
  categoria: CategoriaTicket,
  asunto: string,
  descripcion: string
) => {
  const ticket = ticketRepo().create({ user_id: userId, categoria, asunto, descripcion });
  return ticketRepo().save(ticket);
};

// RF-41 — Mis tickets
export const misTickets = async (userId: string) => {
  return ticketRepo().find({
    where: { user_id: userId },
    relations: ['comentarios'],
    order: { created_at: 'DESC' },
  });
};

// RF-42 — Añadir comentario (usuario)
export const agregarComentario = async (
  ticketId: string,
  autorId: string,
  tipoAutor: TipoAutor,
  contenido: string
) => {
  const ticket = await ticketRepo().findOne({ where: { id: ticketId } });
  if (!ticket) throw new Error('Ticket no encontrado');
  if (ticket.estado === EstadoTicket.CERRADO) throw new Error('No se puede comentar un ticket cerrado');

  const comentario = comentarioRepo().create({ ticket, autor_id: autorId, tipo_autor: tipoAutor, contenido });
  return comentarioRepo().save(comentario);
};

// RF-43 — Listar todos los tickets (administrador)
export const listarTickets = async (estado?: EstadoTicket) => {
  const where = estado ? { estado } : {};
  return ticketRepo().find({
    where,
    relations: ['comentarios'],
    order: { created_at: 'DESC' },
  });
};

// RF-44 — Tomar/asignar ticket (administrador)
export const asignarTicket = async (ticketId: string, adminId: string) => {
  const ticket = await ticketRepo().findOne({ where: { id: ticketId } });
  if (!ticket) throw new Error('Ticket no encontrado');

  await ticketRepo().update({ id: ticketId }, {
    asignado_a: adminId,
    estado: EstadoTicket.EN_PROCESO,
  });
  return ticketRepo().findOne({ where: { id: ticketId }, relations: ['comentarios'] });
};

// RF-45 — Responder ticket (administrador)
export const responderTicket = async (ticketId: string, adminId: string, contenido: string) => {
  const ticket = await ticketRepo().findOne({ where: { id: ticketId } });
  if (!ticket) throw new Error('Ticket no encontrado');

  const comentario = await agregarComentario(ticketId, adminId, TipoAutor.ADMINISTRADOR, contenido);

  // Usuario no registrado: notificar por correo
  if (!ticket.user_id && ticket.email_contacto) {
    try {
      await enviarRespuestaTicket(ticket.email_contacto, ticketId, ticket.asunto, contenido);
    } catch {
      // El envío de email falla en silencio para no bloquear la respuesta
    }
  }

  return comentario;
};

// RF-46 — Actualizar estado (administrador)
export const actualizarEstado = async (ticketId: string, estado: EstadoTicket) => {
  const ticket = await ticketRepo().findOne({ where: { id: ticketId } });
  if (!ticket) throw new Error('Ticket no encontrado');

  await ticketRepo().update({ id: ticketId }, { estado });
  return ticketRepo().findOne({ where: { id: ticketId }, relations: ['comentarios'] });
};

// Admin — Estadísticas de tickets para el dashboard
export const getEstadisticas = async () => {
  const db = AppDataSource;
  const estados  = ['abierto', 'en_proceso', 'resuelto', 'cerrado'];
  const categorias = ['problema_tecnico', 'reporte_abuso', 'otro'];

  const [total, por_estado_raw, por_categoria_raw, por_mes, por_mes_categoria, tiempo_resolucion] = await Promise.all([
    db.query('SELECT COUNT(*)::int AS count FROM tickets'),
    db.query('SELECT estado, COUNT(*)::int AS count FROM tickets GROUP BY estado'),
    db.query('SELECT categoria, COUNT(*)::int AS count FROM tickets GROUP BY categoria'),
    db.query("SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS mes, COUNT(*)::int AS count FROM tickets GROUP BY mes ORDER BY mes"),
    db.query("SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS mes, categoria, COUNT(*)::int AS count FROM tickets GROUP BY mes, categoria ORDER BY mes"),
    db.query("SELECT categoria, ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400)::numeric, 1)::float AS dias_promedio FROM tickets WHERE estado IN ('resuelto', 'cerrado') GROUP BY categoria"),
  ]);

  const estadoMap: Record<string, number> = Object.fromEntries(
    por_estado_raw.map((r: any) => [r.estado, r.count])
  );
  const categoriaMap: Record<string, number> = Object.fromEntries(
    por_categoria_raw.map((r: any) => [r.categoria, r.count])
  );

  return {
    total:              total[0].count,
    por_estado:         estados.map(e  => ({ estado: e,    count: estadoMap[e]    ?? 0 })),
    por_categoria:      categorias.map(c => ({ categoria: c, count: categoriaMap[c] ?? 0 })),
    por_mes,
    por_mes_categoria,
    tiempo_resolucion,
  };
};

// Ver ticket por id
export const verTicket = async (ticketId: string) => {
  const ticket = await ticketRepo().findOne({
    where: { id: ticketId },
    relations: ['comentarios'],
  });
  if (!ticket) throw new Error('Ticket no encontrado');
  return ticket;
};
// Público — Crear ticket sin autenticación (vincula por email si el usuario existe)
export const crearTicketPublico = async (
  email: string,
  categoria: CategoriaTicket,
  asunto: string,
  descripcion: string
) => {
  let userId: string | null = null;

  try {
    const authUrl = process.env.MS_AUTH_URL || 'http://localhost:3001';
    const apiKey = process.env.INTERNAL_API_KEY || '';
    const resp = await axios.post(
      `${authUrl}/api/auth/interno/por-email`,
      { email },
      { headers: { 'x-api-key': apiKey }, timeout: 3000 }
    );
    userId = resp.data?.data?.id ?? null;
  } catch {
    // ms-auth no disponible o email no registrado — ticket anónimo
  }

  const ticket = ticketRepo().create({
    user_id: userId ?? undefined,
    email_contacto: email.toLowerCase(),
    categoria,
    asunto,
    descripcion,
  });
  return ticketRepo().save(ticket);
};
