import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  Query,
} from '@nestjs/common';
import { HuntsService } from './hunts.service';
import { ReorderBonusesDto } from './dto/reorder-bonuses.dto';
import { UpdateBonusStatusDto } from './dto/update-bonus-status.dto';
import { AddBonusDto } from './dto/add-bonus.dto';
import { PaginationDto } from './dto/pagination.dto';
import { CreateHuntDto } from './dto/create-hunt.dto';

@Controller('hunts')
export class HuntsController {
  constructor(private readonly huntsService: HuntsService) {}

  @Post()
  create(@Body() createHuntDto: CreateHuntDto) {
    return this.huntsService.create(createHuntDto);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.huntsService.findAll(paginationDto);
  }

  @Get('/active')
  findActive() {
    return this.huntsService.findActive();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.huntsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string) {
    return this.huntsService.update(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.huntsService.remove(+id);
  }

  @Put(':id/bonuses/reorder')
  reorderBonuses(
    @Param('id') id: string,
    @Body() reorderDto: ReorderBonusesDto,
  ) {
    return this.huntsService.reorderBonuses(+id, reorderDto);
  }

  @Patch(':huntId/bonuses/:bonusId/status')
  updateBonusStatus(
    @Param('huntId') huntId: string,
    @Param('bonusId') bonusId: string,
    @Body() updateStatusDto: UpdateBonusStatusDto,
  ) {
    return this.huntsService.updateBonusStatus(
      +huntId,
      +bonusId,
      updateStatusDto.status,
    );
  }

  @Get(':huntId/bonuses/pending')
  getPendingBonuses(@Param('huntId') huntId: string) {
    return this.huntsService.getPendingBonuses(+huntId);
  }

  @Get(':huntId/bonuses')
  getAllBonuses(@Param('huntId') huntId: string) {
    return this.huntsService.getAllBonusesForHunt(+huntId);
  }

  @Post(':huntId/bonuses')
  addBonusToHunt(
    @Param('huntId') huntId: string,
    @Body() addBonusDto: AddBonusDto,
  ) {
    return this.huntsService.addBonusToHunt(+huntId, addBonusDto);
  }
}
