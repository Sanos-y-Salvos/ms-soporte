import { Router } from 'express';
import * as TicketController from '../controllers/ticket.controller';
import { verifyToken, soloAdmin } from '../middlewares/verifyToken';

const router = Router();

/**
 * @swagger
 * /api/tickets/publico:
 *   post:
 *     summary: Crear ticket público (sin autenticación)
 *     tags: [Tickets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, categoria, descripcion]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ciudadano@ejemplo.com
 *               categoria:
 *                 type: string
 *                 enum: [problema_tecnico, reporte_abuso, otro]
 *               asunto:
 *                 type: string
 *                 example: Problema con luminaria
 *               descripcion:
 *                 type: string
 *                 example: Hay una luminaria apagada en la calle 5.
 *     responses:
 *       201:
 *         description: Ticket público creado exitosamente
 *       400:
 *         description: Faltan datos obligatorios
 */

/**
 * @swagger
 * /api/tickets:
 *   post:
 *     summary: Crear ticket (RF-40)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categoria, asunto, descripcion]
 *             properties:
 *               categoria:
 *                 type: string
 *                 enum: [problema_tecnico, reporte_abuso, otro]
 *               asunto:
 *                 type: string
 *                 example: No puedo subir fotos
 *               descripcion:
 *                 type: string
 *                 example: Al intentar subir una foto me aparece error 500
 *     responses:
 *       201:
 *         description: Ticket creado exitosamente
 *   get:
 *     summary: Listar todos los tickets (RF-43) — solo administrador
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [abierto, en_proceso, resuelto, cerrado]
 *     responses:
 *       200:
 *         description: Lista de tickets
 *       403:
 *         description: Acceso denegado
 */
router.post('/publico', TicketController.crearTicketPublico);
router.post('/', verifyToken, TicketController.crearTicket);
router.get('/', verifyToken, soloAdmin, TicketController.listarTickets);

/**
 * @swagger
 * /api/tickets/mis-tickets:
 *   get:
 *     summary: Ver mis tickets (RF-41)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tickets del usuario autenticado
 */
router.get('/estadisticas', verifyToken, soloAdmin, TicketController.getEstadisticas);
router.get('/mis-tickets', verifyToken, TicketController.misTickets);

/**
 * @swagger
 * /api/tickets/{id}:
 *   get:
 *     summary: Ver ticket por ID
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalle del ticket con comentarios
 *       404:
 *         description: Ticket no encontrado
 */
router.get('/:id', verifyToken, TicketController.verTicket);

/**
 * @swagger
 * /api/tickets/{id}/comentarios:
 *   post:
 *     summary: Añadir comentario al ticket (RF-42)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [contenido]
 *             properties:
 *               contenido:
 *                 type: string
 *                 example: Adjunto captura del error
 *     responses:
 *       201:
 *         description: Comentario agregado
 */
router.post('/:id/comentarios', verifyToken, TicketController.agregarComentario);

/**
 * @swagger
 * /api/tickets/{id}/asignar:
 *   patch:
 *     summary: Tomar o asignar ticket (RF-44) — solo administrador
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket asignado y en proceso
 */
router.patch('/:id/asignar', verifyToken, soloAdmin, TicketController.asignarTicket);

/**
 * @swagger
 * /api/tickets/{id}/responder:
 *   post:
 *     summary: Responder ticket (RF-45) — solo administrador
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [contenido]
 *             properties:
 *               contenido:
 *                 type: string
 *                 example: Hemos revisado el problema y lo solucionaremos en 24 horas
 *     responses:
 *       201:
 *         description: Respuesta agregada
 */
router.post('/:id/responder', verifyToken, soloAdmin, TicketController.responderTicket);

/**
 * @swagger
 * /api/tickets/{id}/estado:
 *   patch:
 *     summary: Actualizar estado del ticket (RF-46) — solo administrador
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [estado]
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [abierto, en_proceso, resuelto, cerrado]
 *     responses:
 *       200:
 *         description: Estado actualizado
 */
router.patch('/:id/estado', verifyToken, soloAdmin, TicketController.actualizarEstado);

export default router;