export const CacheConfig = () => ({
  REDIS: {
    HOST: process.env.REDIS_HOST,
    PORT: parseInt(process.env.REDIS_PORT, 10),

    CLUSTER_NODES: process.env.REDIS_CLUSTER_NODES,

    RETRY_ATTEMPTS: parseInt(process.env.REDIS_RETRY_ATTEMPTS, 10) || 5,
    RETRY_DELAY: parseInt(process.env.REDIS_RETRY_DELAY, 10) || 1000,

    CONNECTION_POOL_MIN:
      parseInt(process.env.REDIS_CONNECTION_POOL_MIN, 10) || 2,
    CONNECTION_POOL_MAX:
      parseInt(process.env.REDIS_CONNECTION_POOL_MAX, 10) || 10,
  },
});
