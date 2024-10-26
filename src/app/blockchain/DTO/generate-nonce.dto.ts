import * as Joi from 'joi';

export const generateNonceSchema = Joi.object({
  wallet: Joi.alternatives()
    .try(
      Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/), // Ethereum
      Joi.string().pattern(
        /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-zA-HJ-NP-Z0-9]{39,59}$/,
      ), // Bitcoin (P2PKH, P2SH, Bech32)
      Joi.string().pattern(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/), // Solana
      Joi.string().pattern(/^r[0-9a-zA-Z]{24,34}$/), // Ripple (XRP)
      Joi.string().pattern(/^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$/), // Litecoin
    )
    .required(),
});

export class GenerateNonceDTO {
  wallet: string;
}
