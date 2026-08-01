import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

@Processor('notifications')
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  @Process()
  async handle(job: Job): Promise<void> {
    this.logger.log(`Processing notification job ${job.id}`);
    // TODO: implement notification dispatch
  }
}
