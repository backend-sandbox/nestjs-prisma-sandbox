import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TaskController } from './controllers';
import { TaskProcessor } from './services';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'file-processing',
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        // removeOnComplete: 5, // * Keep 5 completed jobs for debugging
        removeOnFail: { age: 24 * 3600, count: 10 }, // * Keep 10 failed jobs for 24 hours
      },
    }),
  ],
  controllers: [TaskController],
  providers: [TaskProcessor],
})
export class TaskModule {}
