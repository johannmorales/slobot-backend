import { Column } from 'typeorm';

export class Money {
  @Column('decimal', {
    precision: 5,
    scale: 2,
  })
  amount: number;

  @Column({ type: 'char', length: 3 })
  currency: string;
}
