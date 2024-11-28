import * as mongoose from 'mongoose';

export const CampaignSchema = new mongoose.Schema(
  {
    campaignAddress: { type: String, required: true },
    creatorAddress: { type: String, required: true },

    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    goalAmount: { type: Number, required: true },
    totalContributed: { type: Number, default: 0 },
    endDate: { type: Number, required: true },
    isGoalMet: { type: Boolean, default: false },
    isCampaignEnded: { type: Boolean, default: false },
    isReleased: { type: Boolean, default: false },
    isRefunded: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Campaign = mongoose.model('Campaign', CampaignSchema);

export interface CampaignModel {
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
