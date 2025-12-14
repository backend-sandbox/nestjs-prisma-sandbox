import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';

export class QueueData {
  fileName: string;
  fileType: string;
}

@Injectable()
@Processor('file-processing')
export class TaskProcessor extends WorkerHost {
  async process(job: Job<QueueData>): Promise<void> {
    console.log('Processing job:', job.name, 'with data:', job.data);

    const handlers: Record<string, () => Promise<void>> = {
      'process-task': async () => await this.processTask(job.data),
    };

    const jobName = job.name;
    const handler = jobName ? handlers[jobName] : undefined;

    if (handler) {
      await handler();
      console.log(`Task ${job.name} ${job.id} completed successfully`);
    } else {
      console.log('Unknown job type:', job.name);
    }
  }

  private async processTask(data: QueueData): Promise<void> {
    console.log('Processing file:', data.fileName, 'of type:', data.fileType);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log(`Task completed successfully`);
  }
}
