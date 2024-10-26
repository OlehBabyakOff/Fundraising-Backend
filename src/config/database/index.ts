export const DatabaseConfig = () => ({
  MONGO: {
    URI: process.env.MONGO_URI || 'mongodb://localhost:27017/',
  },
});
