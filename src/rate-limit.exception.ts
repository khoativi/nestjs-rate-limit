import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Exception thrown when the rate limit has been exceeded.
 */
export class RateLimitException extends HttpException {
  /**
   * Creates a new ThrottlerException instance.
   *
   * @param message - Optional custom error message.
   */
  constructor(message?: string) {
    super(message ?? 'Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
  }
}
