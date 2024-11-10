import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RedisModule } from './providers/cache/redis.module';

import { AuthModule } from './app/auth/auth.module';
import { UserModule } from './app/user/user.module';

import { APIConfig, CacheConfig, DatabaseConfig } from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [APIConfig, DatabaseConfig, CacheConfig],
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO.URI'),
      }),
      inject: [ConfigService],
    }),
    RedisModule,
    AuthModule,
    UserModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
