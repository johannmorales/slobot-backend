import {
  Controller,
  Get,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  getTasks() {
    return this.tasksService.getAvailableTasks();
  }

  @Post()
  async startTask(@Body('name') name: string) {
    if (!name) {
      throw new HttpException('Task name is required', HttpStatus.BAD_REQUEST);
    }

    const result = await this.tasksService.startTask(name);

    if (!result.success) {
      throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
    }

    return result;
  }
}
