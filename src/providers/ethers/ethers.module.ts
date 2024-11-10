import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EthersProvider } from './ethers.provider';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [EthersProvider],
  exports: [EthersProvider],
})
export class EthersModule {}
