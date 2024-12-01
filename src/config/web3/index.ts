export const EthersConfig = () => ({
  ETHEREUM: {
    PRIVATE_KEY:
      process.env.INFURA_PRIVATE_KEY ||
      '0x86e185d0c18b2d200df7cbdc097fedbe396524c67eaedba4e6e297b06ca0cd69',
    RPC_URL:
      process.env.INFURA_RPC_URL ||
      // 'https://sepolia.infura.io/v3/384a472d6b5d4447b7a9f86afcc15635',
      'http://127.0.0.1:7545',
    FACTORY_ADDRESS: process.env.FACTORY_ADDRESS || '',
  },
  PINATA: {
    API_KEY: process.env.PINATA_API_KEY || '',
    SECRET_KEY: process.env.PINATA_SECRET_KEY || '',
  },
});
