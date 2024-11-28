import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';

import { RedisModule } from './providers/cache/redis.module';
import { EthersModule } from './providers/ethers/ethers.module';
import { PinataModule } from './providers/pinata/pinata.module';
import { CronjobModule } from './providers/cronjob/cronjob.module';
import { WebSocketModule } from './providers/websocket/websocket.module';

import { AuthModule } from './app/auth/auth.module';
import { UserModule } from './app/user/user.module';
import { CampaignModule } from './app/campaign/campaign.module';

import { memoryStorage } from 'multer';

import { APIConfig, CacheConfig, DatabaseConfig, EthersConfig } from './config';
import { CampaignSchema } from './app/campaign/schemas/campaign.schema';
import { TransactionSchema } from './app/campaign/schemas/transactions.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [APIConfig, DatabaseConfig, CacheConfig, EthersConfig],
      isGlobal: true,
    }),
    MulterModule.register({
      storage: memoryStorage(),
    }),
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO.URI'),
        dbName: 'CryptoFunds',
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: 'Campaign', schema: CampaignSchema }]),
    MongooseModule.forFeature([
      { name: 'Transaction', schema: TransactionSchema },
    ]),
    RedisModule,
    WebSocketModule,
    CronjobModule,
    PinataModule,
    EthersModule,
    AuthModule,
    UserModule,
    CampaignModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
