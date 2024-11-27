import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EthersProvider } from '../ethers/ethers.provider';

@Injectable()
export class CronjobProvider {
  private readonly logger = new Logger(CronjobProvider.name);

  constructor(private readonly ethersProvider: EthersProvider) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCampaignRefundCron() {
    this.logger.log('Starting refund processing for all campaigns');

    try {
      const totalCampaigns = await this.ethersProvider.getTotalCampaigns();

      const { data } = await this.ethersProvider.getCampaigns(
        0,
        totalCampaigns,
      );

      const addresses = data.map(
        (campaign: { campaignAddress: string }) => campaign.campaignAddress,
      );

      for (const campaignAddress of addresses) {
        try {
          const result =
            await this.ethersProvider.refundFromCampaign(campaignAddress);

          if (result) {
            this.logger.log(
              `Successfully processed refund for campaign: ${campaignAddress}`,
            );
          }
        } catch (error) {
          if (error instanceof BadRequestException) {
            continue;
          }

          this.logger.error(
            `Failed to process refund for campaign ${campaignAddress}`,
            error.stack,
          );
        }
      }
    } catch (error) {
      this.logger.error('Error fetching campaigns', error.stack);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCampaignReleaseCron() {
    this.logger.log('Starting release processing for all campaigns');

    try {
      const totalCampaigns = await this.ethersProvider.getTotalCampaigns();

      const { data } = await this.ethersProvider.getCampaigns(
        0,
        totalCampaigns,
      );

      const addresses = data.map(
        (campaign: { campaignAddress: string }) => campaign.campaignAddress,
      );

      for (const campaignAddress of addresses) {
        try {
          const result =
            await this.ethersProvider.releaseFundsFromCampaign(campaignAddress);

          if (result) {
            this.logger.log(
              `Successfully processed release for campaign: ${campaignAddress}`,
            );
          }
        } catch (error) {
          if (error instanceof BadRequestException) {
            continue;
          }

          this.logger.error(
            `Failed to process release for campaign ${campaignAddress}`,
            error.stack,
          );
        }
      }
    } catch (error) {
      this.logger.error('Error fetching campaigns', error.stack);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCampaignEndCron() {
    this.logger.log('Starting end processing for all campaigns');

    try {
      const totalCampaigns = await this.ethersProvider.getTotalCampaigns();

      const { data } = await this.ethersProvider.getCampaigns(
        0,
        totalCampaigns,
      );

      const addresses = data.map(
        (campaign: { campaignAddress: string }) => campaign.campaignAddress,
      );

      for (const campaignAddress of addresses) {
        try {
          const result = await this.ethersProvider.endCampaign(campaignAddress);

          if (result) {
            this.logger.log(`Successfully ended campaign: ${campaignAddress}`);
          }
        } catch (error) {
          if (error instanceof BadRequestException) {
            continue;
          }

          this.logger.error(
            `Failed to end the campaign ${campaignAddress}`,
            error.stack,
          );
        }
      }
    } catch (error) {
      this.logger.error('Error fetching campaigns', error.stack);
    }
  }
}
