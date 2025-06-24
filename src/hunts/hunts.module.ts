import { Module } from '@nestjs/common';
import { HuntsService } from './hunts.service';
import { HuntsController } from './hunts.controller';
import { Hunt } from './entities/hunt.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlotsModule } from 'src/slots/slots.module';
import { Bonus } from './entities/bonus.entity';
import { Slot } from 'src/slots/entities/slot.entity';
import { HuntsSseService } from './hunts-sse.service';
import { HuntsSseController } from './hunts-sse.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Hunt, Bonus, Slot]), SlotsModule],
  controllers: [HuntsController, HuntsSseController],
  providers: [HuntsService, HuntsSseService],
  exports: [HuntsService],
})
export class HuntsModule {}
