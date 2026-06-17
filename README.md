npm run dev

docker compose up --build

docker compose down


# MS-Soporte — Sanos y Salvos

Microservicio de soporte técnico de la plataforma **Sanos y Salvos**. Gestiona el ciclo completo de tickets de soporte, comentarios en hilo único y un chatbot con inteligencia artificial para responder preguntas frecuentes.

---

## Tecnologías

| Herramienta | Uso |
|---|---|
| Node.js + Express | Servidor HTTP |
| TypeScript | Tipado estático |
| PostgreSQL + TypeORM | Persistencia de tickets y comentarios |
| JWT (jsonwebtoken) | Verificación de tokens |
| Groq API (Llama 3) | Chatbot con IA para preguntas frecuentes |
| Swagger (OpenAPI 3.0) | Documentación de endpoints |

---

## Requisitos previos

- Node.js 18+
- PostgreSQL 16+
- Cuenta gratuita en [Groq](https://console.groq.com)

---

## Instalación

```bash
git clone <url-del-repositorio>
cd ms-soporte
npm install
```

---

## Variables de entorno

Crea un archivo `.env` basándote en `.env.example`:

```env
PORT=3003

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=ms_soporte

# JWT (mismo secret que MS-Auth)
JWT_SECRET=tu_secreto_super_seguro
JWT_EXPIRES_IN=15m

# Groq
GROQ_API_KEY=tu_groq_api_key

NODE_ENV=development
TYPEORM_SYNCHRONIZE=true
```

---

## Base de datos

```bash
psql postgres
CREATE DATABASE ms_soporte;
\q
```

TypeORM usa `TYPEORM_SYNCHRONIZE=true` en desarrollo y debe ir en `false` en producción.

---

## Levantar el servidor

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

Salida esperada:
```
✅ Conexión a PostgreSQL establecida
🚀 MS-Soporte corriendo en http://localhost:3003
```

---

## Documentación Swagger

```
http://localhost:3003/api/docs
```

---

## Endpoints

### Tickets

| Método | Ruta | RF | Descripción | Auth | Rol |
|---|---|---|---|---|---|
| POST | `/api/tickets` | RF-40 | Crear ticket | Sí | Usuario |
| GET | `/api/tickets/mis-tickets` | RF-41 | Ver mis tickets | Sí | Usuario |
| GET | `/api/tickets/:id` | — | Ver ticket por ID | Sí | Usuario |
| POST | `/api/tickets/:id/comentarios` | RF-42 | Añadir comentario | Sí | Usuario |
| GET | `/api/tickets` | RF-43 | Listar todos los tickets | Sí | Administrador |
| PATCH | `/api/tickets/:id/asignar` | RF-44 | Tomar/asignar ticket | Sí | Administrador |
| POST | `/api/tickets/:id/responder` | RF-45 | Responder ticket | Sí | Administrador |
| PATCH | `/api/tickets/:id/estado` | RF-46 | Actualizar estado | Sí | Administrador |

### Chatbot

| Método | Ruta | RF | Descripción | Auth |
|---|---|---|---|---|
| POST | `/api/chatbot/preguntar` | RF-47 | Consultar al chatbot | Sí |

---

## Pruebas en Postman

### Prueba 1 — Crear ticket (RF-40)
```
POST http://localhost:3003/api/tickets
Authorization: Bearer <accessToken>
```
Body:
```json
{
    "categoria": "problema_tecnico",
    "asunto": "No puedo subir fotos",
    "descripcion": "Al intentar subir una foto me aparece error 500"
}
```
Respuesta esperada:
```json
{
    "ok": true,
    "data": {
        "id": "uuid-generado",
        "user_id": "uuid-del-usuario",
        "categoria": "problema_tecnico",
        "asunto": "No puedo subir fotos",
        "descripcion": "Al intentar subir una foto me aparece error 500",
        "estado": "abierto",
        "asignado_a": null,
        "created_at": "...",
        "updated_at": "..."
    }
}
```

---

### Prueba 2 — Ver mis tickets (RF-41)
```
GET http://localhost:3003/api/tickets/mis-tickets
Authorization: Bearer <accessToken>
```

---

### Prueba 3 — Añadir comentario (RF-42)
```
POST http://localhost:3003/api/tickets/:id/comentarios
Authorization: Bearer <accessToken>
```
Body:
```json
{
    "contenido": "Adjunto captura del error que me aparece"
}
```

---

### Prueba 4 — Listar todos los tickets (RF-43) — solo administrador
```
GET http://localhost:3003/api/tickets
Authorization: Bearer <accessToken-administrador>
```

Filtrar por estado:
```
GET http://localhost:3003/api/tickets?estado=abierto
```

---

### Prueba 5 — Tomar ticket (RF-44) — solo administrador
```
PATCH http://localhost:3003/api/tickets/:id/asignar
Authorization: Bearer <accessToken-administrador>
```

---

### Prueba 6 — Responder ticket (RF-45) — solo administrador
```
POST http://localhost:3003/api/tickets/:id/responder
Authorization: Bearer <accessToken-administrador>
```
Body:
```json
{
    "contenido": "Hemos revisado el problema y lo solucionaremos en 24 horas"
}
```

---

### Prueba 7 — Actualizar estado (RF-46) — solo administrador
```
PATCH http://localhost:3003/api/tickets/:id/estado
Authorization: Bearer <accessToken-administrador>
```
Body:
```json
{
    "estado": "resuelto"
}
```
Estados válidos: `abierto`, `en_proceso`, `resuelto`, `cerrado`

---

### Prueba 8 — Chatbot (RF-47)
```
POST http://localhost:3003/api/chatbot/preguntar
Authorization: Bearer <accessToken>
```
Body:
```json
{
    "pregunta": "¿Cómo reporto una mascota perdida?"
}
```
Respuesta esperada:
```json
{
    "ok": true,
    "data": {
        "respuesta": "Para reportar una mascota perdida debes..."
    }
}
```

---

## Modelo de datos

### Estados del ticket

| Estado | Descripción |
|---|---|
| `abierto` | Ticket recién creado, sin atender |
| `en_proceso` | Ticket tomado por un administrador |
| `resuelto` | Problema solucionado |
| `cerrado` | Ticket finalizado, no acepta más comentarios |

### Categorías del ticket

| Categoría | Descripción |
|---|---|
| `problema_tecnico` | Fallas o errores en la plataforma |
| `reporte_abuso` | Comportamiento indebido de usuarios |
| `otro` | Cualquier otra consulta |

### Comentarios

El hilo de comentarios es único por ticket. Cada comentario identifica quién lo escribió mediante `tipo_autor`:
- `usuario` — comentario del ciudadano que abrió el ticket
- `administrador` — respuesta del equipo de soporte

---

## Estructura del proyecto

```
ms-soporte/
├── src/
│   ├── config/
│   │   ├── db.ts           # Conexión PostgreSQL + TypeORM
│   │   └── swagger.ts      # Configuración OpenAPI
│   ├── controllers/
│   │   ├── ticket.controller.ts
│   │   └── chatbot.controller.ts
│   ├── middlewares/
│   │   ├── errorHandler.ts
│   │   ├── notFound.ts
│   │   └── verifyToken.ts  # Verifica JWT + middleware soloAdmin
│   ├── models/
│   │   ├── Ticket.ts       # Entidad con estados y categorías
│   │   └── Comentario.ts   # Hilo de comentarios por ticket
│   ├── routes/
│   │   ├── ticket.routes.ts
│   │   └── chatbot.routes.ts
│   ├── services/
│   │   ├── ticket.service.ts
│   │   └── chatbot.service.ts  # Integración con Groq API
│   ├── utils/
│   │   └── response.ts
│   ├── app.ts
│   └── server.ts
├── .env
├── .env.example
├── .gitignore
└── README.md
```

---

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor en modo desarrollo con hot reload |
| `npm run build` | Compila TypeScript a JavaScript |
| `npm start` | Ejecuta la versión compilada |

---

## Decisiones técnicas

- **Groq API con Llama 3:** chatbot gratuito con modelo de lenguaje real, sin necesidad de tarjeta de crédito. Contexto del sistema configurado exclusivamente para responder sobre Sanos y Salvos.
- **Hilo único de comentarios:** usuarios y administradores comparten el mismo hilo identificados por `tipo_autor`, facilitando el seguimiento cronológico de la conversación.
- **Middleware `soloAdmin`:** protege todos los endpoints administrativos verificando que el rol en el JWT sea `administrador`.
- **Soft close de tickets:** los tickets cerrados no aceptan nuevos comentarios pero el historial se conserva íntegro en la base de datos.
- **UUID como identificador:** previene enumeración maliciosa de tickets (IDOR).
