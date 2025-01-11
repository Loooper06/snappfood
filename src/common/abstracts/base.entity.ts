import { CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

export class BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;
  @CreateDateColumn({ type: 'time with time zone' })
  createdAt: Date;
  @CreateDateColumn({ type: 'time with time zone' })
  updatedAt: Date;
}
