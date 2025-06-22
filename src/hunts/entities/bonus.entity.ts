import { Slot } from 'src/slots/entities/slot.entity';
import { Hunt } from './hunt.entity';
import { Money } from 'src/common/entities/money.embedded';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum BonusStatus {
  PENDING = 'PENDING',
  OPENED = 'OPENED',
}

@Entity()
export class Bonus {
  @PrimaryGeneratedColumn()
  id: number;
  @ManyToOne(() => Slot)
  slot: Slot;
  @ManyToOne(() => Hunt, { eager: false })
  hunt: Hunt;
  @Column(() => Money)
  bet: Money;
  @Column({ nullable: true })
  notes?: string;
  @Column({ default: 100 })
  value: number;
  @Column({ default: -1 })
  orderIndex: number;
  @Column({
    type: 'enum',
    enum: BonusStatus,
    default: BonusStatus.PENDING,
  })
  status: BonusStatus;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
