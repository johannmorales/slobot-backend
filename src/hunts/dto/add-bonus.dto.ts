import { IsNumber, IsString, IsOptional, IsPositive } from 'class-validator';

export class AddBonusDto {
  @IsNumber()
  @IsPositive()
  slotId: number;

  @IsNumber()
  @IsPositive()
  value: number;

  @IsString()
  betAmount: string;

  @IsString()
  currency: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
