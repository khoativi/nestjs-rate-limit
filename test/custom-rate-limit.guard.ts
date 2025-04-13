import { Injectable } from '@nestjs/common';
import { Request } from 'express';

import { RateLimitGuard } from '../src';

/**
 * CustomRateLimitGuard overrides the default key generation to use the "authorization" header.
 * If the request contains an "authorization" header, its value is used as the rate limiting key;
 * otherwise, it falls back to the default implementation.
 */
@Injectable()
export class CustomRateLimitGuard extends RateLimitGuard {
  /**
   * Computes a tracker (key) for rate limiting.
   *
   * This implementation checks if the request has an "authorization" header.
   * If present, it returns the header's value; otherwise, it calls the base implementation.
   *
   * @param request - The HTTP request object.
   * @returns A promise that resolves to the tracker string.
   */
  protected async getTracker(request: Request): Promise<string> {
    if (request.headers && request.headers.authorization) {
      return request.headers.authorization;
    }
    return super.getTracker(request);
  }
}
