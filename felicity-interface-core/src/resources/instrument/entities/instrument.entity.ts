import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

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
  client: boolean;

  @Column({ nullable: true })
  clientPort: number;

  @Column({ nullable: true })
  clientHost: string;

  @Column({ nullable: true })
  server: boolean;

  @Column({ nullable: true })
  serverPort: number;

  @Column({ nullable: true })
  autoReconnect: boolean;

  @Column({ nullable: true })
  connectionType: string;
}
