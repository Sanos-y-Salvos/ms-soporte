import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MS-Soporte — Sanos y Salvos',
      version: '1.0.0',
      description: 'Microservicio de soporte: tickets, comentarios y chatbot con IA',
    },
    servers: [{ url: 'http://localhost:3003', description: 'Servidor de desarrollo' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

export default swaggerJsdoc(options);