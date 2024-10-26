import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis, Cluster } from 'ioredis';
import { CacheOptions } from './interfaces/cache.interface';

@Injectable()
export class RedisProvider implements OnModuleDestroy {
  private readonly logger = new Logger(RedisProvider.name);
  private redisClient: Redis | Cluster;

  constructor(private configService: ConfigService) {
    this.redisClient = this.createRedisClient();
  }

  private createRedisClient(): Redis | Cluster {
    const clusterNodes = this.configService.get<string>('REDIS.CLUSTER_NODES');
    const retryAttempts = this.configService.get<number>(
      'REDIS.RETRY_ATTEMPTS',
    );
    const retryDelay = this.configService.get<number>('REDIS.RETRY_DELAY');

    console.log(retryAttempts);

    // CLUSTER CONFIGURATION
    if (clusterNodes) {
      const nodes = clusterNodes.split(',').map((node) => {
        const [host, port] = node.split(':');
        return { host, port: +port };
      });

      this.logger.log('Initializing Redis in Cluster Mode ...');

      return new Cluster(nodes, {
        redisOptions: {
          sentinelRetryStrategy: (times: number) => {
            return Math.min(times * retryDelay, 2000);
          },

          maxRetriesPerRequest: retryAttempts,
        },
      });
    }

    // STANDALONE CONFIGURATION
    const host = this.configService.get<string>('REDIS.HOST');
    const port = this.configService.get<number>('REDIS.PORT');

    this.logger.log('Initializing Redis in Standalone Mode ...');
    return new Redis({
      host,
      port,
      retryStrategy: (times: number) => {
        return Math.min(times * retryDelay, 2000);
      },
      maxRetriesPerRequest: retryAttempts,
    });
  }

  // REDIS METHODS

  getClient(): Redis | Cluster {
    return this.redisClient;
  }

  buildCacheKey = ({ scope, entity, identifiers = [] }) => {
    const _prefix = 'API:';

    const _entity = entity !== '*' ? `${entity}` : entity;

    const _identifiers =
      entity !== '*' && Array.isArray(identifiers) && identifiers.length
        ? `#${identifiers.join('|')}`
        : '';

    return `${_prefix}${scope}:${_entity}${_identifiers}`;
  };

  hashIdentifiers = (identifiers) => {
    const sortedIdentifiers = Object.keys(identifiers)
      .sort()
      .reduce((obj, key) => {
        obj[key] = identifiers[key];

        return obj;
      }, {});

    return Object.entries(sortedIdentifiers).join('').replace(/[\s,]/g, '');
  };

  async getCachedValue(
    key: string,
    callback = () => null,
    options: CacheOptions = { ttl: 3600 },
  ) {
    const value = await this.redisClient.get(key);

    if (value) {
      return JSON.parse(value);
    }

    const result = await callback();

    if (result) {
      const { ttl } = options;

      await this.setKeyWithExpire(key, result, ttl);
    }

    return result;
  }

  async setKeyWithExpire(key, value, expire) {
    await this.redisClient.setex(key, expire, value);
  }

  async setKey(key, value) {
    await this.redisClient.set(key, value);
  }

  async addToSet(setKey, ttl = null, ...value) {
    await this.redisClient.sadd(setKey, ...value);

    if (ttl) {
      await this.redisClient.expire(setKey, ttl);
    }
  }

  async setHashKey(hashkey, ...args) {
    await this.redisClient.hset(hashkey, ...args);
  }

  async getValue(key) {
    return this.redisClient.get(key);
  }

  async remapRelation(relations, identifiers = {}) {
    return relations.map((relation) => {
      return relation(identifiers);
    });
  }

  async onModuleDestroy() {
    this.logger.log('Closing Redis connection ...');
    await this.redisClient.quit();
  }
}
