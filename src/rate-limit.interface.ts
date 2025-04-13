/**
 * Interface for a key–value store used for rate limiting.
 */
export interface RateLimitStore {
  /**
   * Retrieves the value associated with the given key.
   *
   * @param key - The key to retrieve.
   * @returns A promise that resolves to the value as a string, or null if not found.
   */
  get(key: string): Promise<string | null>;

  /**
   * Increments the numeric value stored at the given key.
   *
   * @param key - The key to increment.
   * @returns A promise that resolves to the new value after increment.
   */
  incr(key: string): Promise<number>;

  /**
   * Sets an expiration time on the given key.
   *
   * @param key - The key to set expiration on.
   * @param seconds - Expiration time in seconds.
   * @returns A promise that resolves when the expiration is set.
   */
  expire(key: string, seconds: number): Promise<void>;

  /**
   * Retrieves the time to live (TTL) for the given key in seconds.
   *
   * @param key - The key to retrieve TTL for.
   * @returns A promise that resolves to the TTL in seconds, or -1 if the key does not have an expiration.
   */
  ttl(key: string): Promise<number>;
}

/**
 * Options for configuring the rate limiter.
 *
 * @interface RateLimitOptions
 * @property {number} duration - The time window (in seconds) for counting requests.
 * @property {number} limit - The maximum number of allowed requests within the specified time window.
 * @property {RateLimitStore} storeClient - The instance of the key–value store client used for persisting rate limit data.
 * @property {string} [errorMessage] - Optional global custom error message when the rate limit is exceeded.
 * @property {boolean} [countAllRequests] - Optional flag to indicate if all requests should be counted.
 */
export interface RateLimitOptions {
  duration: number;
  limit: number;
  storeClient: RateLimitStore;
  errorMessage?: string;
  countAllRequests?: boolean;
}
