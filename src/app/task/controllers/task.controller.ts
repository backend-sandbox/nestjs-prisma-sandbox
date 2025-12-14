import { InjectQueue } from '@nestjs/bullmq';
import { Controller, Post } from '@nestjs/common';
import { Queue } from 'bullmq';

@Controller('tasks')
export class TaskController {
  constructor(
    @InjectQueue('file-processing') private readonly tasksQueue: Queue,
  ) {}

  @Post('process')
  async processTask() {
    await this.tasksQueue.add(
      'process-task',
      {
        fileName: 'super known naming',
        fileType: 'txt file',
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );

    return { message: 'Task has been added to the queue' };
  }
}
