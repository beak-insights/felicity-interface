import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('instrument')
export class Instrument {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ length: 50 })
  name: string;

  @Column({ nullable: true })
  code: string;

  @Column({ nullable: true })
  protocol: string;

  @Column({ nullable: true })
  isClient: boolean;

  @Column({ nullable: true })
  port: number;

  @Column({ nullable: true })
  host: string;

  @Column({ nullable: true })
  path: string;

  @Column({ nullable: true })
  baudRate: number;

  @Column({ nullable: true })
  autoReconnect: boolean;

  @Column({ nullable: true })
  connectionType: string;
}
