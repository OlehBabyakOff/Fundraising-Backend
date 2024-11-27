import * as Joi from 'joi';

export const donateSchema = Joi.object({
  amount: Joi.string().required(),
});

export class DonateDTO {
  amount: string;
}
