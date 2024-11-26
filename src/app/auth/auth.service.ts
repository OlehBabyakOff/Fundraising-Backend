import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { RedisProvider } from 'src/providers/cache/redis.provider';
import { EthersProvider } from 'src/providers/ethers/ethers.provider';

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { RefreshDTO, SignInDTO } from './DTO/sign-in.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisProvider: RedisProvider,
    private readonly ethersProvider: EthersProvider,
  ) {}

  async signIn(signInDTO: SignInDTO): Promise<{
    user: Object;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    const verifyMessage = `Please sign this message to authenticate: ${signInDTO.nonce}`;

    const signerAddress = this.ethersProvider.verifyMessage(
      verifyMessage,
      signInDTO.signature,
    );

    if (signerAddress.toLowerCase() !== signInDTO.wallet.toLowerCase()) {
      throw new BadRequestException("Wallet addresses doesn't match");
    }

    const userNonce = await this.redisProvider.getValue(
      this.redisProvider.buildCacheKey({
        scope: 'User',
        entity: 'Nonce',
        identifiers: [
          this.redisProvider.hashIdentifiers({
            wallet: signInDTO.wallet,
          }),
        ],
      }),
    );

    if (!userNonce) {
      throw new BadRequestException('Nonce not found');
    }

    if (userNonce !== signInDTO.nonce) {
      throw new BadRequestException('Nonce mismatch');
    }

    // remove nonce after validation to prevent from replay attacks
    await this.redisProvider.deleteKeysByPattern(
      this.redisProvider.buildCacheKey({
        scope: 'User',
        entity: 'Nonce',
        identifiers: [
          this.redisProvider.hashIdentifiers({
            wallet: signInDTO.wallet,
          }),
        ],
      }),
    );

    const tokens = await this.getTokens(signInDTO.wallet);

    await Promise.all([
      this.redisProvider.setKeyWithExpire(
        this.redisProvider.buildCacheKey({
          scope: 'Auth',
          entity: 'AccessToken',
          identifiers: [
            this.redisProvider.hashIdentifiers({
              wallet: signInDTO.wallet,
            }),
          ],
        }),
        tokens.accessToken,
        this.configService.get<number>('JWT_ACCESS_TTL'),
      ),
      this.redisProvider.setKeyWithExpire(
        this.redisProvider.buildCacheKey({
          scope: 'Auth',
          entity: 'RefreshToken',
          identifiers: [
            this.redisProvider.hashIdentifiers({
              wallet: signInDTO.wallet,
            }),
          ],
        }),
        tokens.refreshToken,
        this.configService.get<number>('JWT_REFRESH_TTL'),
      ),
    ]);

    return {
      user: {
        wallet: signInDTO.wallet,
      },
      tokens,
    };
  }

  async refreshTokens(
    refreshDTO: RefreshDTO,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const decodedRefreshToken = this.jwtService.verify(
        refreshDTO.refreshToken,
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        },
      );

      if (decodedRefreshToken.wallet !== refreshDTO.wallet) {
        throw new ForbiddenException('Invalid refresh token for this wallet.');
      }

      const tokens = await this.getTokens(refreshDTO.wallet);

      await Promise.all([
        this.redisProvider.setKeyWithExpire(
          this.redisProvider.buildCacheKey({
            scope: 'Auth',
            entity: 'AccessToken',
            identifiers: [
              this.redisProvider.hashIdentifiers({
                wallet: refreshDTO.wallet,
              }),
            ],
          }),
          tokens.accessToken,
          this.configService.get<number>('JWT_ACCESS_TTL'),
        ),
        this.redisProvider.setKeyWithExpire(
          this.redisProvider.buildCacheKey({
            scope: 'Auth',
            entity: 'RefreshToken',
            identifiers: [
              this.redisProvider.hashIdentifiers({
                wallet: refreshDTO.wallet,
              }),
            ],
          }),
          tokens.refreshToken,
          this.configService.get<number>('JWT_REFRESH_TTL'),
        ),
      ]);

      return tokens;
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new ForbiddenException('Refresh token has expired.');
      }

      throw new InternalServerErrorException(
        'An error occurred while refreshing the token.',
      );
    }
  }

  private async getTokens(
    walletAddress: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          walletAddress,
        },
        {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
          expiresIn: '15m',
        },
      ),
      this.jwtService.signAsync(
        {
          walletAddress,
        },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
