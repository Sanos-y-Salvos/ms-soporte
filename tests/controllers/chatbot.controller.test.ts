jest.mock('../../src/services/chatbot.service');

import * as ChatbotService from '../../src/services/chatbot.service';
import * as ChatbotController from '../../src/controllers/chatbot.controller';

const mocked = ChatbotService as jest.Mocked<typeof ChatbotService>;

const buildRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('controllers/chatbot.controller', () => {
  it('responde 400 si no hay pregunta', async () => {
    const req: any = { body: {} };
    const res = buildRes();
    await ChatbotController.preguntar(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(mocked.preguntarChatbot).not.toHaveBeenCalled();
  });

  it('retorna la respuesta del servicio', async () => {
    mocked.preguntarChatbot.mockResolvedValue('hola, ¿qué necesitas?');
    const req: any = { body: { pregunta: 'hola' } };
    const res = buildRes();
    await ChatbotController.preguntar(req, res);
    expect(mocked.preguntarChatbot).toHaveBeenCalledWith('hola');
    expect(res.json).toHaveBeenCalledWith({ ok: true, data: { respuesta: 'hola, ¿qué necesitas?' } });
  });

  it('responde 400 si el servicio lanza error', async () => {
    mocked.preguntarChatbot.mockRejectedValue(new Error('falla'));
    const req: any = { body: { pregunta: 'algo' } };
    const res = buildRes();
    await ChatbotController.preguntar(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ ok: false, message: 'falla' });
  });
});
