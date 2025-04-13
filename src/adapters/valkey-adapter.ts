import ValkeyClient from 'iovalkey';

import { RateLimitStore } from '../rate-limit.interface';

/**
 * Adapter to wrap a Valkey client to implement the RateLimitStore interface.
 *
 * This adapter uses the API provided by iovalkey as described in its documentation.
 * If the get() method returns undefined when a key is not found, this adapter converts it to null.
 */
export class ValkeyAdapter implements RateLimitStore {
  /**
   * Creates a new ValkeyAdapter instance.
   *
   * @param client - An instance of a Valkey client.
   */
  constructor(private readonly client: ValkeyClient) {}

  /**
   * Retrieves the value associated with the given key.
   *
   * @param key - The key to retrieve.
   * @returns A promise that resolves to the value as a string, or null if not found.
   */
  async get(key: string): Promise<string | null> {
    const value = await this.client.get(key);
    return value === undefined ? null : value;
  }

  /**
   * Increments the numeric value stored at the given key.
   *
   * @param key - The key to increment.
   * @returns A promise that resolves to the new value after increment.
   */
  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  /**
   * Sets an expiration time on the given key.
   *
   * @param key - The key to set expiration on.
   * @param seconds - Expiration time in seconds.
   * @returns A promise that resolves when the expiration is set.
   */
  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }

  /**
   * Retrieves the time to live (TTL) for the given key in seconds.
   *
   * @param key - The key to retrieve TTL for.
   * @returns A promise that resolves to the TTL in seconds, or -1 if not found.
   */
  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }
}
