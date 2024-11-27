import * as fs from 'fs';
import * as path from 'path';
import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { WebSocketGatewayProvider } from '../websocket/websocket.gateway.provider';

@Injectable()
export class EthersProvider implements OnModuleDestroy {
  private readonly logger = new Logger(EthersProvider.name);
  private readonly wsProvider: WebSocketGatewayProvider;

  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private factoryContract: ethers.Contract;

  private campaignABI: ethers.InterfaceAbi = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), '/src/providers/ethers/abi/Campaign.json'),
      {
        encoding: 'utf8',
      },
    ),
  ).abi;

  constructor(private configService: ConfigService) {
    this.provider = this.createProvider();
    this.signer = this.createSigner();
    this.factoryContract = this.createFactoryContract();
  }

  private createProvider(): ethers.JsonRpcProvider {
    const rpcUrl = this.configService.get<string>('ETHEREUM.RPC_URL');

    if (!rpcUrl) {
      throw new Error('ETHEREUM RPC_URL is not defined in configuration');
    }

    this.logger.log(`Connecting to Ethereum RPC at ${rpcUrl}`);

    return new ethers.JsonRpcProvider(rpcUrl);
  }

  private createSigner(): ethers.Wallet {
    const privateKey = this.configService.get<string>('ETHEREUM.PRIVATE_KEY');

    if (!privateKey) {
      throw new Error('ETHEREUM.PRIVATE_KEY is not defined in configuration');
    }

    return new ethers.Wallet(privateKey, this.provider);
  }

  private createFactoryContract(): ethers.Contract {
    const factoryAddress = this.configService.get<string>(
      'ETHEREUM.FACTORY_ADDRESS',
    );

    const factoryABI = JSON.parse(
      fs.readFileSync(
        path.join(
          process.cwd(),
          '/src/providers/ethers/abi/CampaignFactory.json',
        ),
        {
          encoding: 'utf8',
        },
      ),
    ).abi;

    if (!factoryAddress || !factoryABI) {
      throw new Error('Factory contract address or ABI not defined');
    }

    return new ethers.Contract(factoryAddress, factoryABI, this.signer);
  }

  async getBalance(address: string): Promise<string> {
    if (!ethers.isAddress(address)) {
      throw new BadRequestException('Invalid Ethereum address');
    }

    try {
      const balance = await this.provider.getBalance(address);

      return ethers.formatEther(balance);
    } catch (error) {
      this.logger.error(
        `Failed to retrieve balance for address: ${address}`,
        error.stack,
      );

      throw new Error('Could not retrieve balance');
    }
  }

  async deployCampaign(
    title: string,
    description: string,
    image: string,
    goalAmount: number,
    endDate: number,
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        this.factoryContract.on('CampaignCreated', (campaignAddress) => {
          console.log(`Campaign created: ${campaignAddress}`);
          resolve(campaignAddress);
        });

        const tx = await this.factoryContract.createCampaign(
          title,
          description,
          image,
          ethers.parseEther(goalAmount.toString()),
          endDate,
        );

        await tx.wait();

        setTimeout(() => {
          reject(new Error('CampaignCreated event not emitted'));
        }, 60000);
      } catch (error) {
        console.error('Failed to deploy campaign:', error);

        reject(error);
      }
    });
  }

  async getCampaigns(
    startIndex: number,
    limit: number,
  ): Promise<{ data: []; total: number }> {
    try {
      const result = await this.factoryContract.getCampaigns(startIndex, limit);

      const formattedResult = result.map((item) => ({
        campaignAddress: item[0],
        creatorAddress: item[1],
        title: item[2],
        description: item[3],
        image: item[4],
        goalAmount: ethers.formatEther(item[5]),
        totalContributed: ethers.formatEther(item[6]),
        endDate: Number(item[7].toString()),
        isGoalMet: item[8],
        isCampaignEnded: item[9],
        isReleased: item[10],
        isRefunded: item[11],
      }));

      return { data: formattedResult, total: formattedResult.length };
    } catch (error) {
      this.logger.error('Failed to retrieve campaigns', error.stack);

      throw new Error('Could not retrieve campaigns');
    }
  }

  async getTotalCampaigns(): Promise<number> {
    try {
      return await this.factoryContract.getTotalCampaigns();
    } catch (error) {
      this.logger.error('Failed to retrieve total campaigns', error.stack);

      throw new Error('Could not retrieve total campaigns');
    }
  }

  async donateToCampaign(
    campaignAddress: string,
    amount: string,
  ): Promise<any> {
    try {
      const campaignContract = new ethers.Contract(
        campaignAddress,
        this.campaignABI,
        this.signer,
      );

      const tx = await campaignContract.donate({
        value: ethers.parseEther(amount),
      });

      const receipt = await tx.wait();

      this.listenForDonationEvent(campaignContract);
      return receipt;
    } catch (error) {
      this.logger.error(
        `Failed to donate to campaign ${campaignAddress}`,
        error.stack,
      );

      throw new Error('Could not donate to campaign');
    }
  }

  async refundFromCampaign(campaignAddress: string): Promise<any> {
    try {
      const campaignContract = new ethers.Contract(
        campaignAddress,
        this.campaignABI,
        this.signer,
      );

      const details = await this.getCampaignDetails(campaignAddress);

      if (
        !details.isRefunded &&
        details.isCampaignEnded &&
        !details.isGoalMet
      ) {
        const tx = await campaignContract.refund();

        const receipt = await tx.wait();

        this.listenForRefundEvent(campaignContract);

        return receipt;
      }
    } catch (error) {
      this.logger.error(
        `Failed to get refund from campaign ${campaignAddress}`,
        error.stack,
      );

      throw new Error('Could not get refund');
    }
  }

  async releaseFundsFromCampaign(campaignAddress: string): Promise<any> {
    try {
      const campaignContract = new ethers.Contract(
        campaignAddress,
        this.campaignABI,
        this.signer,
      );

      const details = await this.getCampaignDetails(campaignAddress);

      if (!details.isReleased && details.isGoalMet && details.isCampaignEnded) {
        const tx = await campaignContract.releaseFunds();

        const receipt = await tx.wait();

        this.listenForFundsReleasedEvent(campaignContract);

        return receipt;
      }
    } catch (error) {
      this.logger.error(
        `Failed to release funds from campaign ${campaignAddress}`,
        error.stack,
      );

      throw new Error('Could not release funds');
    }
  }

  async endCampaign(campaignAddress: string): Promise<any> {
    try {
      const campaignContract = new ethers.Contract(
        campaignAddress,
        this.campaignABI,
        this.signer,
      );

      const details = await this.getCampaignDetails(campaignAddress);

      if (
        !details.isCampaignEnded &&
        !details.isGoalMet &&
        details.endDate < Date.now() &&
        !details.isRefunded &&
        !details.isReleased
      ) {
        const tx = await campaignContract.endCampaign();

        const receipt = await tx.wait();

        return receipt;
      }
    } catch (error) {
      this.logger.error(
        `Failed to end campaign ${campaignAddress}`,
        error.stack,
      );

      throw new Error('Could not end campaign');
    }
  }

  async getCampaignStatus(campaignAddress: string): Promise<any> {
    try {
      const campaignContract = new ethers.Contract(
        campaignAddress,
        this.campaignABI,
        this.provider,
      );

      const [goalAmount, totalContributionsAmount, isGoalMet] =
        await Promise.all([
          campaignContract.goalAmount(),
          campaignContract.totalContributionsAmount(),
          campaignContract.isGoalMet(),
        ]);

      return { goalAmount, totalContributionsAmount, isGoalMet };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve status for campaign ${campaignAddress}`,
        error.stack,
      );

      throw new Error('Could not retrieve campaign status');
    }
  }

  async getCampaignDetails(campaignAddress: string): Promise<any> {
    try {
      const campaignContract = new ethers.Contract(
        campaignAddress,
        this.campaignABI,
        this.provider,
      );

      const details = await campaignContract.getCampaignDetails();

      const decodedDetails = {
        creatorAddress: details[0],
        title: details[1],
        description: details[2],
        image: details[3],
        goalAmount: ethers.formatEther(details[4]),
        totalContributed: ethers.formatEther(details[5]),
        endDate: Number(details[6].toString()),
        isGoalMet: details[7],
        isCampaignEnded: details[8],
        isReleased: details[9],
        isRefunded: details[10],
      };

      return decodedDetails;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve details for campaign ${campaignAddress}`,
        error.stack,
      );

      throw new Error('Could not retrieve campaign details');
    }
  }

  verifyMessage(message: string, signature: string) {
    if (!message || !signature) {
      throw new BadRequestException(
        'Message and signature are required for verification',
      );
    }

    try {
      return ethers.verifyMessage(message, signature);
    } catch (error) {
      this.logger.error('Failed to verify message', error.stack);

      throw new Error('Could not verify message');
    }
  }

  //!! For testing
  async signMessageWithBackend(nonce) {
    const message = `Please sign this message to authenticate: ${nonce}`;

    const signature = await this.signer.signMessage(message);

    return { account: this.signer.address, signature };
  }

  private listenForDonationEvent(campaignContract: ethers.Contract) {
    campaignContract.on('DonationReceived', (donor, amount) => {
      this.wsProvider.notifyDonationEvent(donor, ethers.formatEther(amount));

      this.logger.log(
        `Donation received from ${donor} of ${ethers.formatEther(amount)} ETH`,
      );
    });
  }

  private listenForRefundEvent(campaignContract: ethers.Contract) {
    campaignContract.on('RefundIssued', (donor, amount) => {
      this.wsProvider.notifyRefundEvent(donor, ethers.formatEther(amount));

      this.logger.log(
        `Refund issued to ${donor} of ${ethers.formatEther(amount)} ETH`,
      );
    });
  }

  private listenForFundsReleasedEvent(campaignContract: ethers.Contract) {
    campaignContract.on('FundsReleased', (creator, amount) => {
      this.wsProvider.notifyReleaseEvent(creator, ethers.formatEther(amount));

      this.logger.log(`Funds released: ${ethers.formatEther(amount)} ETH`);
    });
  }

  // End

  async onModuleDestroy() {
    this.logger.log('Closing ethers provider connection ...');
  }
}
