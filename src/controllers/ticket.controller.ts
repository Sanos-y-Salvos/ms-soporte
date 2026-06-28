import { Request, Response } from 'express';
import * as TicketService from '../services/ticket.service';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../middlewares/verifyToken';
import { CategoriaTicket, EstadoTicket } from '../models/Ticket';
import { TipoAutor } from '../models/Comentario';
import { getIo } from '../socket/io';

// RF-40
export const crearTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { categoria, asunto, descripcion } = req.body;
    if (!categoria || !descripcion) { errorResponse(res, 'Categoría y descripción requeridos'); return; }
    const asuntoFinal = asunto || (categoria === 'problema_tecnico' ? 'Problema técnico' : categoria === 'reporte_abuso' ? 'Reporte de abuso' : '');
    if (!asuntoFinal) { errorResponse(res, 'El asunto es requerido para la categoría "Otro"'); return; }
    const data = await TicketService.crearTicket(userId, categoria as CategoriaTicket, asuntoFinal, descripcion);
    successResponse(res, data, 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
};

// RF-41
export const misTickets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const data = await TicketService.misTickets(userId);
    successResponse(res, data);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
};

// Ver ticket
export const verTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ticketId = req.params.id as string;
    const data = await TicketService.verTicket(ticketId);
    successResponse(res, data);
  } catch (err: any) {
    errorResponse(res, err.message, 404);
  }
};

// RF-42 — Comentario usuario
export const agregarComentario = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const ticketId = req.params.id as string;
    const { contenido } = req.body;
    if (!contenido) { errorResponse(res, 'Contenido requerido'); return; }
    const data = await TicketService.agregarComentario(ticketId, userId, TipoAutor.USUARIO, contenido);
    getIo()?.to(`ticket:${ticketId}`).emit('comentario_recibido', data);
    successResponse(res, data, 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
};

// RF-43 — Listar todos (administrador)
export const listarTickets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const estado = req.query.estado as EstadoTicket | undefined;
    const data = await TicketService.listarTickets(estado);
    successResponse(res, data);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
};

// RF-44 — Asignar ticket (administrador)
export const asignarTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user!.id;
    const ticketId = req.params.id as string;
    const data = await TicketService.asignarTicket(ticketId, adminId);
    successResponse(res, data!);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
};

// RF-45 — Responder ticket (administrador)
export const responderTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user!.id;
    const ticketId = req.params.id as string;
    const { contenido } = req.body;
    if (!contenido) { errorResponse(res, 'Contenido requerido'); return; }
    const data = await TicketService.responderTicket(ticketId, adminId, contenido);
    getIo()?.to(`ticket:${ticketId}`).emit('comentario_recibido', data);
    successResponse(res, data, 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
};

// RF-46 — Actualizar estado (administrador)
export const actualizarEstado = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ticketId = req.params.id as string;
    const { estado } = req.body;
    if (!estado) { errorResponse(res, 'Estado requerido'); return; }
    const data = await TicketService.actualizarEstado(ticketId, estado as EstadoTicket);
    successResponse(res, data!);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
};
// Admin — Estadísticas para el dashboard
export const getEstadisticas = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await TicketService.getEstadisticas();
    successResponse(res, data);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
};

// Público — Crear ticket sin autenticación
export const crearTicketPublico = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, categoria, asunto, descripcion } = req.body;
    if (!email || !categoria || !descripcion) {
      errorResponse(res, 'Email, categoría y descripción son requeridos');
      return;
    }
    const asuntoFinal = asunto || (categoria === 'otro' ? '' : categoria === 'problema_tecnico' ? 'Problema técnico' : 'Reporte de abuso');
    if (!asuntoFinal) { errorResponse(res, 'El asunto es requerido para la categoría "Otro"'); return; }
    const data = await TicketService.crearTicketPublico(email, categoria as CategoriaTicket, asuntoFinal, descripcion);
    successResponse(res, data, 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
};
