import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import { RedisProvider } from 'src/providers/cache/redis.provider';
import { BlockchainService } from './blockchain.service';
import { JoiValidationPipe } from 'src/common/pipes/joi-validation.pipe';
import {
  generateNonceSchema,
  GenerateNonceDTO,
} from './DTO/generate-nonce.dto';

@Controller('blockchain')
export class BlockchainController {
  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly redisProvider: RedisProvider,
  ) {}

  @Post('nonces')
  @UsePipes(new JoiValidationPipe(generateNonceSchema))
  async generateNonce(@Body() generateNonceDTO: GenerateNonceDTO) {
    const nonce = await this.redisProvider.getCachedValue(
      this.redisProvider.buildCacheKey({
        scope: 'Blockchain',
        entity: 'Nonce',
        identifiers: [
          this.redisProvider.hashIdentifiers({
            wallet: generateNonceDTO.wallet,
          }),
        ],
      }),
      () => this.blockchainService.generateNonce(),
      { ttl: 300 },
    );

    return { nonce };
  }
}
