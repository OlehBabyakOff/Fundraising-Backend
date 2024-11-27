import { Module } from '@nestjs/common';
import { CampaignController } from './campaign.controller';
import { CampaignService } from './campaign.service';

@Module({
  imports: [],
  controllers: [CampaignController],
  providers: [CampaignService],
})
export class CampaignModule {}
