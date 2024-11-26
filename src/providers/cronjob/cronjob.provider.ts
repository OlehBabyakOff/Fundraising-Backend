import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CronjobProvider {
  private readonly logger = new Logger(CronjobProvider.name);

  // Runs every minute
  @Cron(CronExpression.EVERY_MINUTE)
  handleEveryMinuteCron() {
    this.logger.log('Cron job executed every minute');
    // Add your logic here
  }
}
