import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ResultRaw } from './result_raw.entity';
import { Instrument } from 'src/resources/instrument/entities/instrument.entity';

@Entity('result_order')
export class ResultOrder {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  order_id: string;

  @Column({ nullable: true })
  test_id: string;

  @Column({ nullable: true })
  keyword: string;

  @ManyToOne(() => Instrument, (instrument) => instrument.id)
  instrument: Instrument;

  @Column({ nullable: true })
  result: string;

  @Column({ nullable: true })
  result_date: string;

  @Column({ nullable: true })
  unit: string;

  @Column({ nullable: true })
  comment: string;

  @Column({ nullable: true, default: true })
  is_sync_allowed: boolean;

  @Column({ nullable: true, default: false })
  synced: boolean;

  @Column({ nullable: true })
  sync_date: string;

  @Column({ nullable: true })
  sync_comment: string;

  @OneToOne(() => ResultRaw)
  @JoinColumn()
  result_raw: ResultRaw;
}
