import * as Joi from 'joi';

export const createCampaignSchema = Joi.object({
  title: Joi.string().min(3).max(100).required().messages({
    'string.base': 'Title should be a string',
    'string.min': 'Title should be at least 3 characters long',
    'string.max': 'Title should be at most 100 characters long',
    'any.required': 'Title is required',
  }),

  description: Joi.string().min(10).max(500).required().messages({
    'string.base': 'Description should be a string',
    'string.min': 'Description should be at least 10 characters long',
    'string.max': 'Description should be at most 500 characters long',
    'any.required': 'Description is required',
  }),

  goalAmount: Joi.number().greater(0).precision(18).required().messages({
    'number.base': 'Goal amount should be a number',
    'number.greater': 'Goal amount should be greater than 0',
    'number.precision': 'Goal amount should have at most 18 decimal places',
    'any.required': 'Goal amount is required',
  }),

  endDate: Joi.number().required(),
});

export class CreateCampaignDTO {
  title: string;
  description: string;
  goalAmount: number;
  endDate: number;
}
