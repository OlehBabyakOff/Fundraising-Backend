import { BadRequestException, Injectable } from '@nestjs/common';
import { RedisProvider } from 'src/providers/cache/redis.provider';

import { CreateCampaignDTO } from './DTO/create-campaign.dto';
import { PinataProvider } from 'src/providers/pinata/pinata.provider';
import { EthersProvider } from 'src/providers/ethers/ethers.provider';
import { DonateDTO } from './DTO/donate.dto';
import { resolvePagination } from 'src/common/helpers/pagination.helper';

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

  async getList(query) {
    const { startIndex, endIndex } = resolvePagination(query);

    const campaigns = await this.ethersProvider.getCampaigns(
      startIndex,
      endIndex,
    );

    const filteredCampaigns = campaigns.data.filter(
      (campaign: { isCampaignEnded: boolean; totalContributed: string }) =>
        !campaign.isCampaignEnded,
    );

    const sortedCampaigns =
      {
        popular: filteredCampaigns.sort(
          (
            a: { totalContributed: string },
            b: { totalContributed: string },
          ) => {
            return (
              Number.parseFloat(b.totalContributed) -
              Number.parseFloat(a.totalContributed)
            );
          },
        ),
        ending: filteredCampaigns.sort(
          (a: { endDate: string }, b: { endDate: string }) => {
            const now = new Date().getTime();
            const endA = new Date(a.endDate).getTime();
            const endB = new Date(b.endDate).getTime();

            return Math.abs(endA - now) - Math.abs(endB - now);
          },
        ),
        new: filteredCampaigns.sort(
          (
            a: { totalContributed: string },
            b: { totalContributed: string },
          ) => {
            return (
              Number.parseFloat(a.totalContributed) -
              Number.parseFloat(b.totalContributed)
            );
          },
        ),
      }[query.filter] ||
      filteredCampaigns.sort(
        (a: { totalContributed: string }, b: { totalContributed: string }) => {
          return (
            Number.parseFloat(b.totalContributed) -
            Number.parseFloat(a.totalContributed)
          );
        },
      );

    return { data: sortedCampaigns, total: filteredCampaigns.length };
  }

  async getSlider() {
    const totalCampaigns = await this.ethersProvider.getTotalCampaigns();

    const { data } = await this.ethersProvider.getCampaigns(0, totalCampaigns);

    const filteredCampaigns = data.length
      ? data
          .filter(
            (campaign: {
              isCampaignEnded: boolean;
              totalContributed: string;
            }) =>
              !campaign.isCampaignEnded &&
              Number.parseFloat(campaign.totalContributed) > 0,
          )
          .sort(
            (
              a: { totalContributed: string },
              b: { totalContributed: string },
            ) => {
              return (
                Number.parseFloat(b.totalContributed) -
                Number.parseFloat(a.totalContributed)
              );
            },
          )
          .slice(0, 5)
      : [];

    return filteredCampaigns;
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
