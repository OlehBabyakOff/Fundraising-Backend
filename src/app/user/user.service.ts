import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { pagination } from 'src/common/helpers/pagination.helper';
import { RedisProvider } from 'src/providers/cache/redis.provider';

import { EthersProvider } from 'src/providers/ethers/ethers.provider';
import { ITransaction } from '../campaign/schemas/transactions.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ICampaign } from '../campaign/schemas/campaign.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel('Transaction') private transactionModel: Model<ITransaction>,
    @InjectModel('Campaign') private campaignModel: Model<ICampaign>,
    private readonly redisProvider: RedisProvider,
    private readonly ethersProvider: EthersProvider,
  ) {}

  async generateNonce(wallet: string): Promise<string> {
    const nonce = await this.redisProvider.getCachedValue(
      this.redisProvider.buildCacheKey({
        scope: 'User',
        entity: 'Nonce',
        identifiers: [
          this.redisProvider.hashIdentifiers({
            wallet,
          }),
        ],
      }),
      () => randomBytes(16).toString('hex'),
      { ttl: 300 },
    );

    return nonce;
  }

  async getBalance(wallet) {
    return this.ethersProvider.getBalance(wallet);
  }

  async getTransactions(wallet, query) {
    const { count, skip } = pagination(query);

    const match = {
      $expr: {
        $eq: [{ $toLower: '$creatorAddress' }, wallet.toLowerCase()],
      },
    };

    const [data, total] = await Promise.all([
      this.transactionModel.aggregate([
        { $match: match },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: count },
        {
          $project: {
            campaignAddress: 1,
            creatorAddress: 1,
            amount: 1,
            type: 1,
            createdAt: 1,
            hash: 1,
          },
        },
      ]),
      this.transactionModel.countDocuments(match),
    ]);

    return {
      data: data || [],
      total: total || 0,
    };
  }

  async getMyCampaigns(wallet, query) {
    const { count, skip } = pagination(query);

    const match = {
      $expr: {
        $eq: [{ $toLower: '$creatorAddress' }, wallet.toLowerCase()],
      },
    };

    const [data, total] = await Promise.all([
      this.campaignModel.aggregate([
        { $match: match },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: count },
        {
          $project: {
            campaignAddress: 1,
            creatorAddress: 1,
            title: 1,
            goalAmount: 1,
            isCampaignEnded: 1,
            isGoalMet: 1,
            isReleased: 1,
            isRefunded: 1,
            totalContributed: 1,
            transactionHash: 1,
            createdAt: 1,
          },
        },
      ]),
      this.campaignModel.countDocuments(match),
    ]);

    return {
      data: data || [],
      total: total || 0,
    };
  }
}
