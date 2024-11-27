export const APIConfig = () => ({
  PORT: parseInt(process.env.PORT, 10) || 5000,

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || '',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || '',

  JWT_ACCESS_TTL: process.env.JWT_ACCESS_TTL || 1 * 24 * 60 * 60,
  JWT_REFRESH_TTL: process.env.JWT_REFRESH_TTL || 7 * 24 * 60 * 60,
});
