import { IsArray, IsNumber } from 'class-validator';

export class ReorderBonusesDto {
  @IsArray()
  @IsNumber({}, { each: true })
  bonusIds: number[];
}
