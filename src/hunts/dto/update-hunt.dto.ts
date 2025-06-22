import { PartialType } from '@nestjs/mapped-types';
import { CreateHuntDto } from './create-hunt.dto';

export class UpdateHuntDto extends PartialType(CreateHuntDto) {}
