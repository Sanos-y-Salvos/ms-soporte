import { preguntarChatbot } from '../../src/services/chatbot.service';

describe('services/chatbot.service', () => {
  it('retorna la respuesta correcta para una palabra clave', async () => {
    const result = await preguntarChatbot('hola, buenos días');
    expect(result).toBe('¡Hola! Soy el asistente virtual de Sanos y Salvos. ¿En qué te puedo ayudar hoy respecto a mascotas perdidas o encontradas?');
  });

  it('ignora los acentos y mayúsculas al buscar palabras clave', async () => {
    const result = await preguntarChatbot('quiero CÓntactar al DUEÑO');
    expect(result).toBe('Cuando se confirma una coincidencia, se habilitará la opción para ver los datos de contacto o acceder a un chat con el otro usuario para coordinar la entrega.');
  });

  it('retorna el mensaje por defecto si no hay coincidencias', async () => {
    const result = await preguntarChatbot('algo totalmente diferente y sin sentido');
    expect(result).toBe('No encontré una respuesta exacta a tu pregunta. Si es un problema técnico, por favor crea un ticket de soporte.');
  });
});
