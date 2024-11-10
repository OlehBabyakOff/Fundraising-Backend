import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

@Injectable()
export class EthersProvider implements OnModuleDestroy {
  private readonly logger = new Logger(EthersProvider.name);
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;

  constructor(private configService: ConfigService) {
    this.provider = this.createProvider();

    this.signer = this.createSigner();
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

  // For tests
  // async signMessageWithBackend(nonce) {
  //   const message = `Please sign this message to authenticate: ${nonce}`;

  //   const signature = await this.signer.signMessage(message);

  //   return { account: this.signer.address, signature };
  // }

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

  async contractMethod(
    contractAddress: string,
    abi: any,
    methodName: string,
    params: any[],
  ): Promise<any> {
    if (!ethers.isAddress(contractAddress)) {
      throw new BadRequestException('Invalid contract address');
    }
    if (!Array.isArray(abi) || !abi.length) {
      throw new BadRequestException('Invalid ABI provided');
    }
    if (!methodName || typeof methodName !== 'string') {
      throw new BadRequestException('Method name must be a valid string');
    }
    if (!Array.isArray(params)) {
      throw new BadRequestException('Params must be an array');
    }
    try {
      const contract = new ethers.Contract(contractAddress, abi, this.signer);

      return await contract[methodName](...params);
    } catch (error) {
      this.logger.error(
        `Failed to execute method ${methodName} on contract ${contractAddress}`,
        error.stack,
      );

      throw new Error(`Could not execute contract method: ${methodName}`);
    }
  }

  async onModuleDestroy() {
    this.logger.log('Closing ethers provider connection ...');
  }
}
