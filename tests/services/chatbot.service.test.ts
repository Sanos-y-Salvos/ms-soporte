const createMock = jest.fn();

jest.mock('groq-sdk', () => {
  return jest.fn().mockImplementation(() => ({
    chat: { completions: { create: createMock } },
  }));
});

import { preguntarChatbot } from '../../src/services/chatbot.service';

describe('services/chatbot.service', () => {
  it('retorna el contenido de la primera opción del modelo', async () => {
    createMock.mockResolvedValue({
      choices: [{ message: { content: 'Hola, ¿en qué puedo ayudarte?' } }],
    });

    const result = await preguntarChatbot('hola');

    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 500,
      temperature: 0.5,
      messages: expect.arrayContaining([
        expect.objectContaining({ role: 'user', content: 'hola' }),
      ]),
    }));
    expect(result).toBe('Hola, ¿en qué puedo ayudarte?');
  });

  it('retorna el mensaje por defecto si no hay contenido', async () => {
    createMock.mockResolvedValue({ choices: [{ message: { content: '' } }] });
    const result = await preguntarChatbot('algo');
    expect(result).toBe('No pude generar una respuesta. Por favor crea un ticket de soporte.');
  });

  it('retorna el mensaje por defecto si no hay choices', async () => {
    createMock.mockResolvedValue({ choices: [] });
    const result = await preguntarChatbot('algo');
    expect(result).toBe('No pude generar una respuesta. Por favor crea un ticket de soporte.');
  });
});
