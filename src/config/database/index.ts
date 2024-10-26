export const DatabaseConfig = () => ({
  MONGO: {
    URI: process.env.MONGO_URI,
    PORT: parseInt(process.env.MONGO_PORT, 10),
  },
});
