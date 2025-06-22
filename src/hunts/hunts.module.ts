import { Module } from '@nestjs/common';
import { HuntsService } from './hunts.service';
import { HuntsController } from './hunts.controller';
import { Hunt } from './entities/hunt.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlotsModule } from 'src/slots/slots.module';
import { Bonus } from './entities/bonus.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Hunt]),
    TypeOrmModule.forFeature([Bonus]),
    SlotsModule,
  ],
  controllers: [HuntsController],
  providers: [HuntsService],
  exports: [HuntsService],
})
export class HuntsModule {}
