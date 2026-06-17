import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany
} from 'typeorm';
import { Comentario } from './Comentario';

export enum EstadoTicket {
  ABIERTO = 'abierto',
  EN_PROCESO = 'en_proceso',
  RESUELTO = 'resuelto',
  CERRADO = 'cerrado',
}

export enum CategoriaTicket {
  PROBLEMA_TECNICO = 'problema_tecnico',
  REPORTE_ABUSO = 'reporte_abuso',
  OTRO = 'otro',
}

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  user_id!: string;

  @Column({ nullable: true })
  email_contacto!: string;

  @Column({ type: 'enum', enum: CategoriaTicket })
  categoria!: CategoriaTicket;

  @Column()
  asunto!: string;

  @Column({ type: 'text' })
  descripcion!: string;

  @Column({ type: 'enum', enum: EstadoTicket, default: EstadoTicket.ABIERTO })
  estado!: EstadoTicket;

  @Column({ nullable: true })
  asignado_a!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @OneToMany(() => Comentario, (comentario) => comentario.ticket)
  comentarios!: Comentario[];
}