import { Global, Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { ScheduleModule } from '@nestjs/schedule';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Task]), ScheduleModule.forRoot()],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
