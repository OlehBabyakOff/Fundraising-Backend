import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { RedisProvider } from 'src/providers/cache/redis.provider';

import { CreateCampaignDTO } from './DTO/create-campaign.dto';
import { PinataProvider } from 'src/providers/pinata/pinata.provider';
import { EthersProvider } from 'src/providers/ethers/ethers.provider';
import { DonateDTO } from './DTO/donate.dto';
import { pagination } from 'src/common/helpers/pagination.helper';
import { ICampaign } from './schemas/campaign.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ITransaction } from './schemas/transactions.schema';

@Injectable()
export class CampaignService {
  constructor(
    @InjectModel('Campaign') private campaignModel: Model<ICampaign>,
    @InjectModel('Transaction') private transactionModel: Model<ITransaction>,
    private readonly redisProvider: RedisProvider,
    private readonly pinataProvider: PinataProvider,
    private readonly ethersProvider: EthersProvider,
  ) {}

  async uploadImage(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const ipfsLink = await this.pinataProvider.uploadFile(file);

    return ipfsLink;
  }

  async create(createCampaignDTO: CreateCampaignDTO) {
    await this.ethersProvider.validateTransactionReceipt(
      createCampaignDTO.transactionHash,
    );

    const newCampaign = await new this.campaignModel({
      ...createCampaignDTO,
      endDate: new Date(createCampaignDTO.endDate).getTime(),
    });

    return newCampaign.save();
  }

  async getList(query) {
    const { count, skip } = pagination(query);

    const match = { isCampaignEnded: false };

    const sort = {
      popular: { differenceToGoal: 1 },
      ending: { timeDifference: 1 },
      new: { createdAt: -1 },
    }[query.filter] || { totalContributed: -1 };

    const [data, total] = await Promise.all([
      this.campaignModel.aggregate([
        { $match: match },
        {
          $addFields: {
            timeDifference: {
              $abs: {
                $subtract: ['$endDate', new Date().getTime()],
              },
            },
            differenceToGoal: {
              $subtract: ['$goalAmount', '$totalContributed'],
            },
          },
        },
        { $sort: sort },
        { $skip: skip },
        { $limit: count },
        {
          $project: {
            title: 1,
            description: 1,
            image: 1,
            endDate: 1,
            goalAmount: 1,
            totalContributed: { $round: ['$totalContributed', 2] },
            campaignAddress: 1,
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

  async getSlider() {
    const match = { isCampaignEnded: false, totalContributed: { $gt: 0 } };

    const data = await this.campaignModel.aggregate([
      { $match: match },
      { $sort: { totalContributed: -1 } },
      { $skip: 0 },
      { $limit: 5 },
      {
        $project: {
          title: 1,
          description: 1,
          image: 1,
          endDate: 1,
          goalAmount: 1,
          totalContributed: { $round: ['$totalContributed', 2] },
          campaignAddress: 1,
        },
      },
    ]);

    return data || [];
  }

  async getDetails(address: string) {
    if (!address) {
      throw new BadRequestException("Адреса збору є обов'язковою!");
    }

    const [result] = await this.campaignModel.aggregate([
      { $match: { campaignAddress: address } },
      {
        $lookup: {
          from: 'transactions',
          localField: 'campaignAddress',
          foreignField: 'campaignAddress',
          pipeline: [{ $sort: { createdAt: -1 } }],
          as: 'transactions',
        },
      },
    ]);

    if (!result) {
      throw new BadRequestException('Збір не знайдено!');
    }

    return result;
  }

  async donate(campaignAddress: string, dto: DonateDTO, donorAddress: string) {
    try {
      const { amount, transactionHash } = dto;

      await this.campaignModel.findOneAndUpdate(
        { campaignAddress: campaignAddress },
        { $inc: { totalContributed: amount } },
      );

      const newTransaction = await new this.transactionModel({
        campaignAddress: campaignAddress,
        creatorAddress: donorAddress,
        amount,
        type: 'donation',
        hash: transactionHash,
      });

      return newTransaction.save();
    } catch (error) {
      console.error('Error while donating:', error.message);

      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }
}
