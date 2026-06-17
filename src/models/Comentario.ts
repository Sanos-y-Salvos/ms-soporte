import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn
} from 'typeorm';
import { Ticket } from './Ticket';

export enum TipoAutor {
  USUARIO = 'usuario',
  ADMINISTRADOR = 'administrador',
}

@Entity('comentarios')
export class Comentario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Ticket, (ticket) => ticket.comentarios)
  @JoinColumn({ name: 'ticket_id' })
  ticket!: Ticket;

  @Column()
  autor_id!: string;

  @Column({ type: 'enum', enum: TipoAutor })
  tipo_autor!: TipoAutor;

  @Column({ type: 'text' })
  contenido!: string;

  @CreateDateColumn()
  created_at!: Date;
}