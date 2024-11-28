import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Transaction extends Document {
  @Prop({ required: true })
  campaignAddress: string;

  @Prop({ required: true })
  creatorAddress: string;

  @Prop({ required: true })
  amount: number;

  @Prop({
    required: true,
    enum: ['donation', 'refund', 'release'],
  })
  type: 'donation' | 'refund' | 'release';

  @Prop({ required: true })
  hash: string;

  @Prop({ default: () => new Date() })
  createdAt?: Date;

  @Prop({ default: () => new Date() })
  updatedAt?: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

export interface ITransaction {
  campaignAddress: string;
  creatorAddress: string;

  amount: Number;
  type: 'donation' | 'refund' | 'release';
  hash: String;

  createdAt?: Date;
  updatedAt?: Date;
}
