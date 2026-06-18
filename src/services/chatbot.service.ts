import fs from 'fs';
import path from 'path';

interface ChatbotRule {
  keywords: string[];
  response: string;
}

export const preguntarChatbot = async (pregunta: string): Promise<string> => {
  const filePath = path.join(__dirname, '../data/chatbot-responses.json');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const rules: ChatbotRule[] = JSON.parse(fileContent);

  const normalizedQuestion = pregunta.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  let bestMatch = null;
  let maxMatches = 0;

  for (const rule of rules) {
    let matches = 0;
    for (const keyword of rule.keywords) {
      const normalizedKeyword = keyword.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (normalizedQuestion.includes(normalizedKeyword)) {
        matches++;
      }
    }

    if (matches > maxMatches) {
      maxMatches = matches;
      bestMatch = rule;
    }
  }

  if (bestMatch && maxMatches > 0) {
    return bestMatch.response;
  }

  return 'No encontré una respuesta exacta a tu pregunta. Si es un problema técnico, por favor crea un ticket de soporte.';
};