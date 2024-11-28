import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CronjobProvider } from './cronjob.provider';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Campaign,
  CampaignSchema,
} from 'src/app/campaign/schemas/campaign.schema';
import {
  Transaction,
  TransactionSchema,
} from 'src/app/campaign/schemas/transactions.schema';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: Campaign.name, schema: CampaignSchema },
    ]),
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  providers: [CronjobProvider],
})
export class CronjobModule {}
