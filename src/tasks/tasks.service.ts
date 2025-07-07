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
   * Gets all available tasks that can be started
   */
  async getAvailableTasks() {
    return this.taskRepo.find({
      order: { startedAt: 'DESC' },
    });
  }

  /**
   * Gets task execution history for all tasks
   */
  async getTaskHistory() {
    return this.taskRepo.find({
      order: { startedAt: 'DESC' },
      take: 50, // Limit to last 50 executions
    });
  }

  /**
   * Gets task execution history for a specific task
   */
  async getTaskHistoryByName(name: string) {
    return this.taskRepo.find({
      where: { name },
      order: { startedAt: 'DESC' },
      take: 20, // Limit to last 20 executions for this task
    });
  }

  /**
   * Gets the current status of a specific task
   */
  async getTaskStatus(name: string) {
    // Check if task exists in available tasks
    const taskDef = this.dailyTasks.find((t) => t.name === name);
    if (!taskDef) {
      throw new Error(`Task '${name}' not found`);
    }

    const latestTask = await this.taskRepo.findOne({
      where: { name },
      order: { startedAt: 'DESC' },
    });

    if (!latestTask) {
      return {
        name,
        description: `Daily task: ${name}`,
        type: 'daily',
        status: 'never_run',
        lastExecution: null,
        isRunning: false,
        canExecute: true,
      };
    }

    const isRunning = latestTask.status === 'running';
    const lastRunDate = latestTask.runDate;
    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date(todayStr);

    return {
      name,
      description: `Daily task: ${name}`,
      type: 'daily',
      status: latestTask.status,
      lastExecution: {
        id: latestTask.id,
        startedAt: latestTask.startedAt,
        finishedAt: latestTask.finishedAt,
        runDate: latestTask.runDate,
        status: latestTask.status,
      },
      isRunning,
      canExecute:
        !isRunning &&
        (lastRunDate.getTime() !== today.getTime() ||
          latestTask.status !== 'success'),
    };
  }

  /**
   * Starts a specific task if it's not already running
   */
  async startTask(name: string) {
    // Check if task exists in available tasks
    const taskDef = this.dailyTasks.find((t) => t.name === name);
    if (!taskDef) {
      return {
        success: false,
        message: `Task '${name}' not found in available tasks`,
      };
    }

    // Check if task is already running
    const runningTask = await this.taskRepo.findOne({
      where: { name, status: 'running' },
    });

    if (runningTask) {
      return {
        success: false,
        message: `Task '${name}' is already running`,
      };
    }

    // Create new task execution record
    const task = this.taskRepo.create({
      name,
      runDate: new Date(new Date().toISOString().split('T')[0]),
      status: 'running',
    });
    await this.taskRepo.save(task);

    // Execute the task in the background without awaiting
    this.executeTaskInBackground(task, taskDef.fn);

    return {
      success: true,
      message: `Task '${name}' started successfully`,
      taskId: task.id,
    };
  }

  /**
   * Executes a task in the background
   */
  private async executeTaskInBackground(
    task: Task,
    taskFn: () => Promise<void>,
  ) {
    try {
      await taskFn();
      task.status = 'success';
    } catch (err) {
      task.status = 'failed';
      console.error(`[${task.name}] Task failed:`, err);
    } finally {
      task.finishedAt = new Date();
      await this.taskRepo.save(task);
    }
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
