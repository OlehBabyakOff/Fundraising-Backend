import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EthersProvider } from './ethers.provider';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Transaction,
  TransactionSchema,
} from 'src/app/campaign/schemas/transactions.schema';

@Global()
@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  providers: [EthersProvider],
  exports: [EthersProvider],
})
export class EthersModule {}
