export const EthersConfig = () => ({
  ETHEREUM: {
    PRIVATE_KEY: process.env.ETHEREUM_PRIVATE_KEY || '',
    RPC_URL:
      process.env.ETHEREUM_RPC_URL ||
      'https://sepolia.infura.io/v3/384a472d6b5d4447b7a9f86afcc15635',
  },
});
