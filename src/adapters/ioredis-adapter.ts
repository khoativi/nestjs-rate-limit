import Redis from 'ioredis';

import { RateLimitStore } from '../rate-limit.interface';

/**
 * Adapter to wrap an ioredis client to implement the RateLimitStore interface.
 */
export class RedisAdapter implements RateLimitStore {
  /**
   * Creates a new IoredisAdapter instance.
   *
   * @param redis - An instance of an ioredis client.
   */
  constructor(private readonly redis: Redis) {}

  /**
   * Retrieves the value associated with the given key.
   *
   * @param key - The key to retrieve.
   * @returns A promise that resolves to the value as a string, or null if not found.
   */
  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  /**
   * Increments the numeric value stored at the given key.
   *
   * @param key - The key to increment.
   * @returns A promise that resolves to the new value after increment.
   */
  async incr(key: string): Promise<number> {
    return this.redis.incr(key);
  }

  /**
   * Sets an expiration time on the given key.
   *
   * @param key - The key to set expiration on.
   * @param seconds - Expiration time in seconds.
   * @returns A promise that resolves when the expiration is set.
   */
  async expire(key: string, seconds: number): Promise<void> {
    await this.redis.expire(key, seconds);
  }

  /**
   * Retrieves the time to live (TTL) for the given key in seconds.
   *
   * @param key - The key to retrieve TTL for.
   * @returns A promise that resolves to the TTL in seconds, or -1 if not found.
   */
  async ttl(key: string): Promise<number> {
    return this.redis.ttl(key);
  }
}
