import { BadRequestException, Injectable } from '@nestjs/common';
import { RedisProvider } from 'src/providers/cache/redis.provider';

import { CreateCampaignDTO } from './DTO/create-campaign.dto';
import { PinataProvider } from 'src/providers/pinata/pinata.provider';
import { EthersProvider } from 'src/providers/ethers/ethers.provider';
import { DonateDTO } from './DTO/donate.dto';

@Injectable()
export class CampaignService {
  constructor(
    private readonly redisProvider: RedisProvider,
    private readonly pinataProvider: PinataProvider,
    private readonly ethersProvider: EthersProvider,
  ) {}

  async create(
    file: Express.Multer.File,
    createCampaignDTO: CreateCampaignDTO,
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const { title, description, goalAmount, endDate } = createCampaignDTO;

    const ipfsLink = await this.pinataProvider.uploadFile(file);

    const campaignAddress = await this.ethersProvider.deployCampaign(
      title,
      description,
      ipfsLink,
      goalAmount,
      endDate,
    );

    return campaignAddress;
  }

  async getList() {
    const result = await this.ethersProvider.getCampaigns(0, 100);

    return result;
  }

  async getDetails(address: string) {
    const result = await this.ethersProvider.getCampaignDetails(address);

    return result;
  }

  async donate(address: string, dto: DonateDTO) {
    try {
      const { amount } = dto;

      const result = await this.ethersProvider.donateToCampaign(
        address,
        amount,
      );

      return result;
    } catch (error) {
      console.error('Error while donating:', error.message);

      throw new Error(`Could not donate to campaign: ${error.message}`);
    }
  }
}