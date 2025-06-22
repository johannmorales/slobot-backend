import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';

type TaskDefinition = {
  name: string;
  fn: () => Promise<void>;
};

@Injectable()
export class TasksService implements OnApplicationBootstrap {
  private dailyTasks: TaskDefinition[] = [];

  constructor(
    @InjectRepository(Task)
    private taskRepo: Repository<Task>,
  ) {}

  // Called once app is fully bootstrapped
  async onApplicationBootstrap() {
    await this.checkDailyTasks();
  }

  /**
   * Registers a function to be executed daily.
   * @param name unique task name (e.g. 'MY_TASK')
   * @param fn async function to execute
   */
  registerDailyTask(name: string, fn: () => Promise<void>) {
    this.dailyTasks.push({ name, fn });
  }

  /**
   * Checks all registered daily tasks and runs the ones
   * that haven't successfully run today or failed/incomplete.
   */
  @Cron('0 * * * *') // every hour at minute 0
  async checkDailyTasks() {
    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date(todayStr);

    for (const taskDef of this.dailyTasks) {
      const existing = await this.taskRepo.findOne({
        where: { name: taskDef.name, runDate: today },
        order: { startedAt: 'DESC' },
      });

      if (existing?.status === 'success') continue;

      const task = this.taskRepo.create({
        name: taskDef.name,
        runDate: today,
        status: 'running',
      });
      await this.taskRepo.save(task);

      try {
        await taskDef.fn();
        task.status = 'success';
      } catch (err) {
        task.status = 'failed';
        console.error(`[${taskDef.name}] Task failed:`, err);
      } finally {
        task.finishedAt = new Date();
        await this.taskRepo.save(task);
      }
    }
  }
}
