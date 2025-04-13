import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';

import {
  RATE_LIMIT_MODULE_OPTIONS,
  RATE_LIMIT_OPTIONS,
  SKIP_RATE_LIMIT
} from './constants';
import { RateLimitDecoratorOptions } from './decorators/rate-limit.decorator';
import { sha256 } from './hash';
import { RateLimitException } from './rate-limit.exception';
import { RateLimitOptions } from './rate-limit.interface';

interface RateLimitRequest extends Request {
  rateLimitTracker?: string;
}

/**
 * Guard that enforces rate limiting by checking the request count in the store.
 *
 * It supports two modes:
 * - If `countAllRequests` is true, every incoming request is immediately counted.
 * - If `countAllRequests` is false, only successful requests are counted (counter incrementation is handled in the interceptor).
 *
 * The guard sets rate limit headers on the response. If the route is not decorated with @RateLimit, rate limiting is skipped.
 * If the request count equals or exceeds the effective limit, it sets the "Retry-After" header and throws a ThrottlerException.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  /**
   * Creates a new RateLimitGuard instance.
   *
   * @param reflector - The Reflector used to retrieve custom metadata.
   * @param options - Global rate limit options.
   */
  constructor(
    protected readonly reflector: Reflector,
    @Inject(RATE_LIMIT_MODULE_OPTIONS)
    protected readonly options: RateLimitOptions
  ) {}

  /**
   * Determines whether the current request is allowed based on rate limiting.
   *
   * If the route is not decorated with @RateLimit, this guard returns true and rate limiting is skipped.
   * Otherwise, it retrieves custom options, computes a tracker (key) for the request (using a custom key if provided),
   * and then, depending on the `countAllRequests` flag, either increments the counter immediately or only reads the current counter.
   * It sets appropriate headers on the response. If the request count equals or exceeds the effective limit,
   * it sets the "Retry-After" header and throws a ThrottlerException.
   *
   * @param context - The current execution context.
   * @returns A promise that resolves to true if the request is allowed.
   * @throws {ThrottlerException} If the rate limit is exceeded.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if the route is marked to skip rate limiting.
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_RATE_LIMIT, [
      context.getHandler(),
      context.getClass()
    ]);
    if (skip) {
      return true;
    }

    // Retrieve custom rate limit options from the decorator.
    const customOptions =
      this.reflector.getAllAndOverride<RateLimitDecoratorOptions>(
        RATE_LIMIT_OPTIONS,
        [context.getHandler(), context.getClass()]
      );

    const effectiveLimit = customOptions?.limit || this.options.limit;
    const effectiveDuration = customOptions?.duration || this.options.duration;
    const countAllRequests =
      customOptions?.countAllRequests || this.options.countAllRequests || false;

    const request = context.switchToHttp().getRequest<RateLimitRequest>();
    const response = context.switchToHttp().getResponse<Response>();

    const tracker = await this.getTracker(request);
    const key = this.generateRateLimitKey(context, tracker);
    request.rateLimitTracker = key;

    // Retrieve TTL for the key; if not set, default to effectiveDuration.
    let ttl = await this.options.storeClient.ttl(key);
    if (ttl < 0) {
      ttl = effectiveDuration;
    }

    let count: number;
    if (countAllRequests) {
      // Increment counter immediately for every request.
      const newCount = await this.options.storeClient.incr(key);
      if (newCount === 1) {
        await this.options.storeClient.expire(key, effectiveDuration);
      }
      count = newCount;
      // In countAllRequests mode, allow if count <= effectiveLimit.
      if (count > effectiveLimit) {
        this.setHeadersLimit(response, ttl);
        throw new RateLimitException(await this.getErrorMessage(context));
      }
    } else {
      // Only read the current counter; incrementation will be handled in the interceptor.
      const currentVal = await this.options.storeClient.get(key);
      count = currentVal ? parseInt(currentVal, 10) : 0;
      if (count >= effectiveLimit) {
        this.setHeadersLimit(response, ttl);
        throw new RateLimitException(await this.getErrorMessage(context));
      }
    }

    // Calculate remaining requests.
    const remaining = effectiveLimit - count;

    // Set rate limit headers for allowed requests.
    this.setHeadersAllow(response, remaining, effectiveLimit, ttl);

    return true;
  }

  /**
   * Sets the rate limiting headers on the response for allowed requests.
   *
   * @param response - The HTTP response object.
   * @param remaining - The number of remaining requests.
   * @param effectiveLimit - The effective limit of requests.
   * @param ttl - The time to reset (TTL) in seconds.
   */
  private setHeadersAllow(
    response: Response,
    remaining: number,
    effectiveLimit: number,
    ttl: number
  ): void {
    if (typeof response.setHeader === 'function') {
      response.setHeader('X-RateLimit-Limit', effectiveLimit);
      response.setHeader(
        'X-RateLimit-Remaining',
        remaining < 0 ? 0 : remaining
      );
      response.setHeader('X-RateLimit-Reset', ttl);
    } else if (typeof response.header === 'function') {
      response.header('X-RateLimit-Limit', String(effectiveLimit));
      response.header(
        'X-RateLimit-Remaining',
        String(remaining < 0 ? 0 : remaining)
      );
      response.header('X-RateLimit-Reset', String(ttl));
    }
  }

  /**
   * Sets the "Retry-After" header on the response when the rate limit is exceeded.
   *
   * @param response - The HTTP response object.
   * @param ttl - The time to reset (TTL) in seconds.
   */
  private setHeadersLimit(response: Response, ttl: number): void {
    if (typeof response.setHeader === 'function') {
      response.setHeader('Retry-After', ttl);
    } else if (typeof response.header === 'function') {
      response.header('Retry-After', String(ttl));
    }
  }

  /**
   * Generates a unique rate limit key based on the request context.
   *
   * The default implementation combines the controller's class name, the handler's name,
   * the HTTP method, the full URL, and the client's IP address, then hashes the result using SHA-256.
   *
   * @param context - The current execution context.
   * @param request - The HTTP request object.
   * @returns A string representing the unique rate limit key.
   */
  private generateRateLimitKey(
    context: ExecutionContext,
    data: string
  ): string {
    const className = context.getClass().name;
    const handlerName = context.getHandler().name;
    return sha256(`${className}-${handlerName}-${data}`);
  }

  /**
   * Computes a tracker (key) for rate limiting.
   *
   * The default implementation returns the client's IP address.
   * Subclasses can override this method to implement custom logic.
   *
   * @param request - The HTTP request object.
   * @returns A promise that resolves to the tracker string.
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  protected async getTracker(request: Request): Promise<string> {
    return (
      (request.ip ?? (request.headers?.['x-forwarded-for'] as string)) ||
      'unknown'
    );
  }

  /**
   * Override this method to customize error messages when rate limit is exceeded.
   *
   * @param context - The current execution context
   * @returns A string or Promise<string> containing the error message
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  protected async getErrorMessage(context: ExecutionContext): Promise<string> {
    const customOptions = this.reflector.get<RateLimitDecoratorOptions>(
      RATE_LIMIT_OPTIONS,
      context.getHandler()
    );

    // Ưu tiên theo thứ tự: per-route > global
    return (
      customOptions?.errorMessage ??
      this.options.errorMessage ??
      'Too Many Requests'
    );
  }
}
