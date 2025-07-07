import { IsString, IsNotEmpty } from 'class-validator';

export class CreateHuntDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
