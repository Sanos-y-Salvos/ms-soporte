import { preguntarChatbot } from '../../services/chatbot.service';

describe('services/chatbot.service', () => {
  it('retorna la respuesta correcta para una palabra clave', async () => {
    const result = await preguntarChatbot('hola, buenos días');
    expect(result).toBe('¡Hola! Soy el asistente virtual de Sanos y Salvos 🐾. Puedo ayudarte con: reportar mascotas, buscar en el mapa, gestionar tu cuenta, entender el sistema de matching o crear un ticket de soporte. ¿En qué te puedo ayudar?');
  });

  it('ignora los acentos y mayúsculas al buscar palabras clave', async () => {
    const result = await preguntarChatbot('quiero CÓntactar al DUEÑO');
    expect(result).toBe("Para contactar a otro usuario:\n1. Necesitas tener una coincidencia aceptada por ambas partes.\n2. Una vez aceptada, se habilitará un chat privado entre los dos.\n3. Ve a 'Mis Matches' y selecciona la conversación.\n4. Coordinen el punto de encuentro o la entrega de la mascota.");
  });

  it('retorna el mensaje por defecto si no hay coincidencias', async () => {
    const result = await preguntarChatbot('algo totalmente diferente y sin sentido');
    expect(result).toBe('No encontré una respuesta exacta a tu pregunta. Si es un problema técnico, por favor crea un ticket de soporte.');
  });
});
