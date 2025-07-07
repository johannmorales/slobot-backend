import { Module } from '@nestjs/common';
import { SlotsService } from './slots.service';
import { SlotsController } from './slots.controller';
import { Slot } from './entities/slot.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElasticModule } from 'src/elastic/elastic.module';

@Module({
  imports: [TypeOrmModule.forFeature([Slot]), ElasticModule],
  controllers: [SlotsController],
  providers: [SlotsService],
  exports: [SlotsService],
})
export class SlotsModule {}
