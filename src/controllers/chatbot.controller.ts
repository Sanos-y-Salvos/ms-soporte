import { Request, Response } from 'express';
import * as ChatbotService from '../services/chatbot.service';
import { successResponse, errorResponse } from '../utils/response';

// RF-47 — Chatbot
export const preguntar = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pregunta } = req.body;
    if (!pregunta) { errorResponse(res, 'Pregunta requerida'); return; }
    const respuesta = await ChatbotService.preguntarChatbot(pregunta);
    successResponse(res, { respuesta });
  } catch (err: any) {
    errorResponse(res, err.message);
  }
};