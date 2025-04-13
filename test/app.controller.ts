import {
  BadRequestException,
  Controller,
  Get,
  UseGuards
} from '@nestjs/common';

import { RateLimit, RateLimitGuard, SkipRateLimit } from '../src';
import { CustomRateLimitGuard } from './custom-rate-limit.guard';

/**
 * Controller for demonstrating rate limiting functionality.
 *
 * This controller provides endpoints to test rate limiting, custom key generation via guard,
 * handling of countAllRequests mode, and skipping rate limiting on specific routes.
 */
@Controller()
export class AppController {
  /**
   * An array used to simulate different outcomes in the rateLimitAll endpoint.
   * @private
   */
  private readonly arr = [1, 2, 3];

  /**
   * Endpoint for basic rate limiting.
   *
   * This route applies a rate limit of 2 requests per 10 seconds.
   *
   * @returns A string indicating a successful rate limited response.
   */
  @RateLimit({ limit: 2, duration: 10 })
  @UseGuards(RateLimitGuard)
  @Get()
  rate(): string {
    return 'rate';
  }

  /**
   * Endpoint demonstrating custom key generation using the CustomRateLimitGuard.
   *
   * This route applies a rate limit of 10 requests per 100 seconds. The key for rate limiting is generated
   * by the custom guard which uses the authorization header or custom logic.
   *
   * @returns A string indicating a successful response for custom key based rate limiting.
   */
  @RateLimit({ limit: 10, duration: 100 })
  @UseGuards(CustomRateLimitGuard)
  @Get('custom-key')
  customKey(): string {
    return 'header';
  }

  /**
   * Endpoint demonstrating the countAllRequests mode.
   *
   * This route applies a rate limit of 10 requests per 60 seconds, counting all incoming requests.
   * If a random value from a predefined array equals 2, it throws a BadRequestException.
   *
   * @returns A string indicating a successful response when the rate limit is not exceeded.
   * @throws {BadRequestException} When the random value equals 2.
   */
  @RateLimit({
    limit: 10,
    duration: 60,
    countAllRequests: true,
    errorMessage: 'Rate Limit All'
  })
  @UseGuards(RateLimitGuard)
  @Get('rate-limit-all')
  rateLimitAll(): string {
    const random = this.arr[Math.floor(Math.random() * this.arr.length)];
    if (random === 2) {
      throw new BadRequestException('Random value is 2, throwing error!');
    }
    return 'all';
  }

  /**
   * Endpoint that is excluded from rate limiting.
   *
   * This route uses the @SkipRateLimit decorator to bypass rate limiting.
   *
   * @returns A string indicating that the endpoint is not rate limited.
   */
  @SkipRateLimit()
  @Get('ignored')
  ignored(): string {
    return 'ignored';
  }
}
