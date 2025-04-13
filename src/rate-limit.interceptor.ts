import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { RATE_LIMIT_MODULE_OPTIONS, RATE_LIMIT_OPTIONS } from './constants';
import { RateLimitDecoratorOptions } from './decorators/rate-limit.decorator';
import { RateLimitOptions } from './rate-limit.interface';

interface RateLimitRequest extends Request {
  rateLimitTracker?: string;
}

/**
 * Interceptor that enforces rate limiting by updating the request count in the store.
 *
 * When countAllRequests is false, it increments the counter only when the response is successful.
 * If countAllRequests is true, the guard already handles counter incrementation.
 */
@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  /**
   * Creates a new RateLimitInterceptor instance.
   *
   * @param options - Global rate limit options.
   * @param reflector - The Reflector used to retrieve custom metadata.
   */
  constructor(
    @Inject(RATE_LIMIT_MODULE_OPTIONS)
    protected readonly options: RateLimitOptions,
    protected readonly reflector: Reflector
  ) {}

  /**
   * Intercepts incoming requests and applies rate limiting.
   *
   * If countAllRequests is false, it increments the counter only when the response is successful (status < 400).
   * Otherwise, no additional incrementation is performed.
   *
   * @param context - The current execution context.
   * @param next - The next call handler.
   * @returns An observable stream of the response.
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RateLimitRequest>();
    const customOptions =
      this.reflector.getAllAndOverride<RateLimitDecoratorOptions>(
        RATE_LIMIT_OPTIONS,
        [context.getHandler(), context.getClass()]
      );
    const countAllRequests =
      customOptions?.countAllRequests ?? this.options.countAllRequests ?? false;

    return next.handle().pipe(
      tap(() => {
        void (async (): Promise<void> => {
          const key = request?.rateLimitTracker;
          if (!countAllRequests && key) {
            const response = context.switchToHttp().getResponse<Response>();
            // Only increment if response is successful.
            if (response.statusCode < 400) {
              const count = await this.options.storeClient.incr(key);
              if (count === 1) {
                await this.options.storeClient.expire(
                  key,
                  customOptions?.duration || this.options.duration
                );
              }
            }
          }
        })();
      })
    );
  }
}
