import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Slot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  provider: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  url: string;

  @Column()
  @Index({ unique: true })
  key: string;

  @Column({ type: 'date' })
  releaseDate: Date;

  @Column({ type: 'text', nullable: true })
  originalJson: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
