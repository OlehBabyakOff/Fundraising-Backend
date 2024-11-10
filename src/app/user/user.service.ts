import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { RedisProvider } from 'src/providers/cache/redis.provider';

@Injectable()
export class UserService {
  constructor(private readonly redisProvider: RedisProvider) {}

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
}
