import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('result_raw')
export class ResultRaw {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  content: string;
}
