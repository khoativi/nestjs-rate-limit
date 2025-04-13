/* eslint-disable @typescript-eslint/no-explicit-any */
import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { APP_INTERCEPTOR, Reflector } from '@nestjs/core';

import { RATE_LIMIT_MODULE_OPTIONS } from './constants';
import { RateLimitGuard } from './rate-limit.guard';
import { RateLimitInterceptor } from './rate-limit.interceptor';
import { RateLimitOptions } from './rate-limit.interface';

/**
 * Interface for asynchronous configuration options.
 */
export interface RateLimitModuleAsyncOptions {
  imports?: any[];
  useFactory: (...args: any[]) => Promise<RateLimitOptions> | RateLimitOptions;
  inject?: any[];
}

/**
 * Global module providing rate limiting functionality using a configurable key–value store.
 *
 * Use forRoot for synchronous configuration and forRootAsync for asynchronous configuration.
 */
@Global()
@Module({})
export class RateLimitModule {
  static forRoot(options: RateLimitOptions): DynamicModule {
    const rateLimitOptionsProvider: Provider = {
      provide: RATE_LIMIT_MODULE_OPTIONS,
      useValue: options
    };

    const reflectorProvider: Provider = {
      provide: Reflector,
      useClass: Reflector
    };

    return {
      module: RateLimitModule,
      providers: [
        rateLimitOptionsProvider,
        reflectorProvider,
        RateLimitGuard,
        RateLimitInterceptor,
        {
          provide: APP_INTERCEPTOR,
          useClass: RateLimitInterceptor
        }
      ],
      exports: [
        RateLimitGuard,
        RateLimitInterceptor,
        rateLimitOptionsProvider,
        Reflector
      ]
    };
  }

  static forRootAsync(options: RateLimitModuleAsyncOptions): DynamicModule {
    const reflectorProvider: Provider = {
      provide: Reflector,
      useClass: Reflector
    };

    const asyncOptionsProvider = this.createAsyncOptionsProvider(options);

    return {
      module: RateLimitModule,
      imports: options.imports || [],
      providers: [
        asyncOptionsProvider,
        reflectorProvider,
        {
          provide: APP_INTERCEPTOR,
          useClass: RateLimitInterceptor
        },
        RateLimitGuard,
        RateLimitInterceptor
      ],
      exports: [
        RateLimitGuard,
        RateLimitInterceptor,
        asyncOptionsProvider,
        Reflector
      ]
    };
  }

  private static createAsyncOptionsProvider(
    options: RateLimitModuleAsyncOptions
  ): Provider {
    return {
      provide: RATE_LIMIT_MODULE_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject || []
    };
  }
}
