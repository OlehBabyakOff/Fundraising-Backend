import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Campaign extends Document {
  @Prop({ required: true })
  campaignAddress: string;

  @Prop({ required: true })
  creatorAddress: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  image: string;

  @Prop({ required: true })
  goalAmount: number;

  @Prop({ default: 0 })
  totalContributed: number;

  @Prop({ required: true })
  endDate: number;

  @Prop({ default: false })
  isGoalMet: boolean;

  @Prop({ default: false })
  isCampaignEnded: boolean;

  @Prop({ default: false })
  isReleased: boolean;

  @Prop({ default: false })
  isRefunded: boolean;

  @Prop({ default: () => new Date() })
  createdAt?: Date;

  @Prop({ default: () => new Date() })
  updatedAt?: Date;
}

export const CampaignSchema = SchemaFactory.createForClass(Campaign);

export interface ICampaign {
  campaignAddress: string;
  creatorAddress: string;
  title: string;
  description: string;
  image: string;
  goalAmount: number;
  totalContributed?: number;
  endDate: number;
  isGoalMet?: boolean;
  isCampaignEnded?: boolean;
  isReleased?: boolean;
  isRefunded?: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}
