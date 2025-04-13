import { CustomDecorator, SetMetadata } from '@nestjs/common';

import { RATE_LIMIT_OPTIONS } from '../constants';

/**
 * Options for the RateLimit decorator.
 *
 * @interface RateLimitDecoratorOptions
 * @property {number} duration - The time window (in seconds) for counting requests.
 * @property {number} limit - The maximum number of allowed requests within the specified time window.
 * @property {string} [errorMessage] - Optional custom error message when the rate limit is exceeded.
 * @property {boolean} [countAllRequests] - Optional flag to indicate if all requests should be counted.
 */
export interface RateLimitDecoratorOptions {
  duration: number;
  limit: number;
  errorMessage?: string;
  countAllRequests?: boolean;
}

/**
 * RateLimit decorator.
 *
 * Sets the rate limit options metadata for the decorated route handler.
 *
 * @param {RateLimitDecoratorOptions} options - The options for rate limiting.
 * @returns A metadata object to be attached to the route handler.
 */
export const RateLimit = (
  options: RateLimitDecoratorOptions
): CustomDecorator<string> => SetMetadata(RATE_LIMIT_OPTIONS, options);
