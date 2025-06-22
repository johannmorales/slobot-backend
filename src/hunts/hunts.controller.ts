import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { HuntsService } from './hunts.service';
import { ReorderBonusesDto } from './dto/reorder-bonuses.dto';
import { UpdateBonusStatusDto } from './dto/update-bonus-status.dto';

@Controller('hunts')
export class HuntsController {
  constructor(private readonly huntsService: HuntsService) {}

  @Post()
  create() {
    return this.huntsService.create('s');
  }

  @Get()
  findAll() {
    return this.huntsService.findAll();
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
}
