import { IsOptional, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Hunt } from '../entities/hunt.entity';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  pageSize?: number = 10;
}

export interface PaginatedHuntsResponse {
  data: Hunt[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}
