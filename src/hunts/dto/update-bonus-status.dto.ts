import { IsEnum } from 'class-validator';
import { BonusStatus } from '../entities/bonus.entity';

export class UpdateBonusStatusDto {
  @IsEnum(BonusStatus)
  status: BonusStatus;
}
