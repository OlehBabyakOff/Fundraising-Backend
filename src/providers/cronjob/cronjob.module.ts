import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CronjobProvider } from './cronjob.provider';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [CronjobProvider],
})
export class CronjobModule {}
