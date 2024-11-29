import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EthersProvider } from '../ethers/ethers.provider';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ICampaign } from 'src/app/campaign/schemas/campaign.schema';
import { ITransaction } from 'src/app/campaign/schemas/transactions.schema';

@Injectable()
export class CronjobProvider {
  private readonly logger = new Logger(CronjobProvider.name);

  constructor(
    private readonly ethersProvider: EthersProvider,
    @InjectModel('Campaign') private campaignModel: Model<ICampaign>,
    @InjectModel('Transaction') private transactionModel: Model<ITransaction>,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCampaignRefundCron() {
    this.logger.log('Starting refund processing for all campaigns');

    try {
      const campaigns = await this.campaignModel.aggregate([
        {
          $addFields: {
            goalNotMet: { $ne: ['$totalContributed', '$goalAmount'] },
          },
        },
        {
          $match: {
            goalNotMet: true,
            isCampaignEnded: true,
            isRefunded: false,
          },
        },
        {
          $project: {
            goalAmount: 1,
            totalContributed: 1,
            isCampaignEnded: 1,
            campaignAddress: 1,
            creatorAddress: 1,
          },
        },
      ]);

      for (const campaign of campaigns) {
        try {
          const result = await this.ethersProvider.refundFromCampaign(
            campaign.campaignAddress,
          );

          if (result) {
            await Promise.all([
              this.campaignModel.updateOne(
                { _id: campaign._id },
                { $set: { isRefunded: true } },
              ),

              new this.transactionModel({
                campaignAddress: campaign.campaignAddress,
                creatorAddress: campaign.creatorAddress,
                amount: campaign.totalContributed,
                type: 'refund',
                hash: result.hash,
              }).save(),
            ]);

            this.logger.log(
              `Successfully processed refund for campaign: ${campaign.campaignAddress}`,
            );
          }
        } catch (error) {
          if (error instanceof BadRequestException) {
            continue;
          }

          this.logger.error(
            `Failed to process refund for campaign ${campaign.campaignAddress}`,
            error.stack,
          );
        }
      }
    } catch (error) {
      this.logger.error('Error fetching campaigns', error.stack);

      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCampaignReleaseCron() {
    this.logger.log('Starting release processing for all campaigns');

    try {
      const campaigns = await this.campaignModel.aggregate([
        {
          $addFields: {
            goalMet: { $eq: ['$totalContributed', '$goalAmount'] },
          },
        },
        {
          $match: {
            goalMet: true,
            isCampaignEnded: true,
            isReleased: false,
          },
        },
        {
          $project: {
            goalAmount: 1,
            totalContributed: 1,
            isCampaignEnded: 1,
            campaignAddress: 1,
            creatorAddress: 1,
          },
        },
      ]);

      for (const campaign of campaigns) {
        try {
          const result = await this.ethersProvider.releaseFundsFromCampaign(
            campaign.campaignAddress,
          );

          if (result) {
            await Promise.all([
              this.campaignModel.updateOne(
                { _id: campaign._id },
                { $set: { isReleased: true } },
              ),

              new this.transactionModel({
                campaignAddress: campaign.campaignAddress,
                creatorAddress: campaign.creatorAddress,
                amount: campaign.totalContributed,
                type: 'release',
                hash: result.hash,
              }).save(),
            ]);

            this.logger.log(
              `Successfully processed release for campaign: ${campaign.campaignAddress}`,
            );
          }
        } catch (error) {
          if (error instanceof BadRequestException) {
            continue;
          }

          this.logger.error(
            `Failed to process release for campaign ${campaign.campaignAddress}`,
            error.stack,
          );
        }
      }
    } catch (error) {
      this.logger.error('Error fetching campaigns', error.stack);

      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCampaignEndCron() {
    this.logger.log('Starting end processing for all campaigns');

    try {
      const campaigns = await this.campaignModel.aggregate([
        {
          $addFields: {
            goalMet: { $eq: ['$totalContributed', '$goalAmount'] },
          },
        },
        {
          $match: {
            $or: [{ goalMet: true }, { endDate: { $lt: Date.now() } }],
            isCampaignEnded: false,
          },
        },
        {
          $project: {
            title: 1,
            description: 1,
            image: 1,
            endDate: 1,
            goalAmount: 1,
            totalContributed: 1,
            isCampaignEnded: 1,
            campaignAddress: 1,
          },
        },
      ]);

      for (const campaign of campaigns) {
        try {
          await this.ethersProvider.endCampaign(campaign.campaignAddress);

          if (campaign.goalAmount === campaign.totalContributed) {
            await this.campaignModel.updateOne(
              { _id: campaign._id },
              { $set: { isCampaignEnded: true, isGoalMet: true } },
            );
          } else {
            await this.campaignModel.updateOne(
              { _id: campaign._id },
              { $set: { isCampaignEnded: true } },
            );
          }

          await this.ethersProvider.resetActiveCampaignStatus(
            campaign.creatorAddress,
          );

          this.logger.log(
            `Successfully ended campaign: ${campaign.campaignAddress}`,
          );
        } catch (error) {
          if (error instanceof BadRequestException) {
            continue;
          }

          this.logger.error(
            `Failed to end the campaign ${campaign.campaignAddress}`,
            error.stack,
          );
        }
      }
    } catch (error) {
      this.logger.error('Error fetching campaigns', error.stack);

      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }
}
