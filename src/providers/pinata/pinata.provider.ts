import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PinataSDK from '@pinata/sdk';
import { Readable } from 'stream';

@Injectable()
export class PinataProvider implements OnModuleDestroy {
  private readonly logger = new Logger(PinataProvider.name);
  private readonly pinata: PinataSDK;

  constructor(private configService: ConfigService) {
    this.pinata = new PinataSDK(
      this.configService.get<string>('PINATA.API_KEY'),
      this.configService.get<string>('PINATA.SECRET_KEY'),
    );
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    try {
      if (!file || !file.buffer) {
        throw new BadRequestException('File is required');
      }

      const pinataMetadata = {
        name: file.originalname + Date.now(),
      };

      const result = await this.pinata.pinFileToIPFS(
        Readable.from(file.buffer),
        { pinataMetadata },
      );

      if (!result || !result.IpfsHash) {
        throw new BadRequestException('Error during file upload to IPFS');
      }

      return `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
    } catch (error) {
      this.logger.error('Failed to upload file to Pinata:', error);

      throw new BadRequestException(
        'Error during file upload to IPFS via Pinata',
      );
    }
  }

  onModuleDestroy() {
    this.logger.log('Closing IPFS provider connection ...');
  }
}
