import { Router } from 'express';
import * as ChatbotController from '../controllers/chatbot.controller';

const router = Router();

/**
 * @swagger
 * /api/chatbot/preguntar:
 *   post:
 *     summary: Consultar al chatbot (RF-47)
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pregunta]
 *             properties:
 *               pregunta:
 *                 type: string
 *                 example: ¿Cómo reporto una mascota perdida?
 *     responses:
 *       200:
 *         description: Respuesta del chatbot
 *       400:
 *         description: Pregunta requerida
 */
router.post('/preguntar', ChatbotController.preguntar);

export default router;