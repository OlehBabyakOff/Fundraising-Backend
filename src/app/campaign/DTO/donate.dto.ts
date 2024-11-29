import * as Joi from 'joi';

export const donateSchema = Joi.object({
  amount: Joi.number().min(0.001).required(),

  transactionHash: Joi.string().required(),
});

export class DonateDTO {
  amount: number;
  transactionHash: string;
}
