import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Bonus } from './bonus.entity';

@Entity()
export class Hunt {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 'Unnamed Hunt' })
  name: string;

  @Index()
  @Column()
  discordChannelId: string;

  @Column()
  isActive: boolean;

  @OneToMany(() => Bonus, (bonus) => bonus.hunt)
  bonuses: Bonus[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
