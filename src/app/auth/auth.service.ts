import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { RedisProvider } from 'src/providers/cache/redis.provider';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SignInDTO } from './DTO/sign-in.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisProvider: RedisProvider,
  ) {}

  async signIn(signInDTO: SignInDTO): Promise<{
    user: Object;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    const verifyMessage = `Please sign this message to authenticate: ${signInDTO.nonce}`;

    const signerAddress = ''; // todo update with verifyMessage from ethers/web3

    // const signerAddress = ethers.utils.verifyMessage(
    //   verifyMessage,
    //   signInDTO.signature,
    // );

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

    const tokens = await this.getTokens(signInDTO.wallet);

    const userSession = await this.redisProvider.getValue(
      this.redisProvider.buildCacheKey({
        scope: 'Auth',
        entity: 'AccessToken',
        identifiers: [
          this.redisProvider.hashIdentifiers({
            wallet: signInDTO.wallet,
          }),
        ],
      }),
    );

    // destroy old auth session (access and refresh tokens)
    if (userSession) {
      await this.redisProvider.deleteKeysByPattern(
        this.redisProvider.buildCacheKey({
          scope: 'Auth',
          entity: '*',
          identifiers: [
            this.redisProvider.hashIdentifiers({
              wallet: signInDTO.wallet,
            }),
          ],
        }),
      );
    }

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
    walletAddress: string,
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const decodedRefreshToken = this.jwtService.verify(refreshToken, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });

    if (decodedRefreshToken.wallet !== walletAddress) {
      throw new ForbiddenException('Invalid refresh token for this wallet.');
    }

    // destroy old auth session (access and refresh tokens)
    await this.redisProvider.deleteKeysByPattern(
      this.redisProvider.buildCacheKey({
        scope: 'Auth',
        entity: '*',
        identifiers: [
          this.redisProvider.hashIdentifiers({
            wallet: walletAddress,
          }),
        ],
      }),
    );

    const tokens = await this.getTokens(walletAddress);

    await Promise.all([
      this.redisProvider.setKeyWithExpire(
        this.redisProvider.buildCacheKey({
          scope: 'Auth',
          entity: 'AccessToken',
          identifiers: [
            this.redisProvider.hashIdentifiers({
              wallet: walletAddress,
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
              wallet: walletAddress,
            }),
          ],
        }),
        tokens.refreshToken,
        this.configService.get<number>('JWT_REFRESH_TTL'),
      ),
    ]);

    return tokens;
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
