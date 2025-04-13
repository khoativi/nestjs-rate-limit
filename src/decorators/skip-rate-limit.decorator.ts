import { CustomDecorator, SetMetadata } from '@nestjs/common';

import { SKIP_RATE_LIMIT } from '../constants';

/**
 * SkipRateLimit decorator.
 *
 * Use this decorator on a route or controller to skip rate limiting.
 *
 * @returns A metadata object indicating that rate limiting should be skipped.
 */
export const SkipRateLimit = (): CustomDecorator<string> =>
  SetMetadata(SKIP_RATE_LIMIT, true);
