import { DataSource } from 'typeorm';
import { Ticket } from '../models/Ticket';
import { Comentario } from '../models/Comentario';
import dotenv from 'dotenv';
dotenv.config({ quiet: true });

const isProduction = process.env.NODE_ENV === 'production';
const shouldSynchronize = process.env.TYPEORM_SYNCHRONIZE
  ? process.env.TYPEORM_SYNCHRONIZE === 'true'
  : !isProduction;

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: shouldSynchronize,
  logging: false,
  entities: [Ticket, Comentario],
});
