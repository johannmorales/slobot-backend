import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { SlotsService } from './slots.service';
import { SearchResult } from './types/search.types';

@Controller('slots')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Get()
  findAll() {
    return this.slotsService.findAll();
  }

  @Get('search')
  async search(@Query('q') query: string): Promise<SearchResult[]> {
    return this.slotsService.query(query);
  }

  @Get('update-search-vectors')
  updateSearchVectors() {
    return this.slotsService.updateAllSearchVectors();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.slotsService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.slotsService.remove(+id);
  }
}
