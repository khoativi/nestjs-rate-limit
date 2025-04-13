# @khoativi/nestjs-rate-limit ⚡

A flexible and efficient rate limiting library for NestJS that supports multiple storage backends—such as Redis (via ioredis) and Valkey (via iovalkey).  
Easily configurable, lightweight, and designed for both global and per-route usage.

## ✨ Features

- 🔁 **Multiple Storage Support** — Works with Redis (`ioredis`) and Valkey (`iovalkey`)
- 🧠 **Custom Key Generation** — Use headers, parameters, or override the default logic
- 📊 **Flexible Counting** — Choose to count all requests or only successful ones
- 🛡️ **Automatic Headers** — Adds standard rate limit headers to responses
- ⚙️ **Global & Route-Level Config** — Configure globally or override per endpoint
- 🚫 **Skip Rate Limit** — Easily skip rate limiting for specific routes
- 🔥 **Fastify & Express Compatible** — Works out of the box with both

## 📦 Installation

```bash
# With npm
npm install @khoativi/nestjs-rate-limit

# With yarn
yarn add @khoativi/nestjs-rate-limit

# With pnpm
pnpm add @khoativi/nestjs-rate-limit
```

Install one of the supported store clients:

```bash
# Redis support
npm install ioredis

# Valkey support
npm install iovalkey
```


## ⚙️ Usage in Your Application

### Global Configuration in AppModule

You can configure the module using `forRoot` or `forRootAsync`.

---

### ✅ Using forRoot (Synchronous)

#### Redis

```ts
// redis.config.ts
import Redis from 'ioredis';
import { IoredisAdapter } from '@khoativi/nestjs-rate-limit';

export const storeClient = new IoredisAdapter(
  new Redis({ host: 'localhost', port: 6379 })
);
```

```ts
// app.module.ts
@Module({
  imports: [
    RateLimitModule.forRoot({
      duration: 30,
      limit: 5,
      storeClient,
      errorMessage: 'Too Many Requests',
      countAllRequests: true
    })
  ],
  providers: [
    { provide: APP_GUARD, useClass: RateLimitGuard }
  ]
})
export class AppModule {}
```

#### Valkey

```ts
// valkey.config.ts
import Valkey from 'iovalkey';
import { ValkeyAdapter } from '@khoativi/nestjs-rate-limit';

export const storeClient = new ValkeyAdapter(
  new Valkey('redis://localhost:6379')
);
```

---

### 🔄 Using forRootAsync (Asynchronous)

```ts
// rate-limit.config.ts
import { RateLimitOptions, IoredisAdapter } from '@khoativi/nestjs-rate-limit';
import Redis from 'ioredis';

export const rateLimitConfig = async (): Promise<RateLimitOptions> => {
  const redisClient = new Redis({ host: 'localhost', port: 6379 });
  return {
    duration: 30,
    limit: 5,
    storeClient: new IoredisAdapter(redisClient),
    errorMessage: 'Too Many Requests',
    countAllRequests: true
  };
};
```

```ts
// app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RateLimitModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: rateLimitConfig
    })
  ],
  providers: [
    { provide: APP_GUARD, useClass: RateLimitGuard }
  ]
})
export class AppModule {}
```

---

## 🚀 Using in Controller

You can apply rate limits using the `@RateLimit()` decorator.

```ts
@Controller('posts')
export class PostsController {
  @Get()
  @RateLimit({ duration: 30, limit: 5 })
  @UseGuards(RateLimitGuard)
  getAll() {
    return 'Limited endpoint';
  }
}
```

---

### 🔐 Customizing the Guard for Authorization Header or Message

```ts
@Injectable()
export class CustomRateLimitGuard extends RateLimitGuard {
  /**
   * Override this method to customize the rate limit key.
   * This version uses the `authorization` header if available.
   */
  protected async getTracker(req: any): Promise<string> {
    return req.headers?.authorization ?? super.getTracker(req);
  }

  /**
   * Override this method to customize the error message.
   * You can integrate with a translation service like nestjs-i18n here.
   */
  protected async getErrorMessage(context: ExecutionContext): Promise<string> {
    // Example: hardcoded, you can replace with i18n service logic
    return 'Too many login attempts. Please try again later.';
  }
}
```

```ts
@Controller('secure')
export class SecureController {
  @Get()
  @RateLimit({ duration: 60, limit: 3 })
  @UseGuards(CustomRateLimitGuard)
  secureData() {
    return 'Rate limited by Authorization header';
  }
}
```

---

## ⚙️ Configuration Options

| Name             | Type      | Description                                                  |
|------------------|-----------|--------------------------------------------------------------|
| `duration`       | `number`  | Time window in seconds                                       |
| `limit`          | `number`  | Max allowed requests per window                              |
| `storeClient`    | `Store`   | Store adapter (Redis, Valkey, or custom)                     |
| `errorMessage`   | `string`  | Custom error message when throttled                          |
| `countAllRequests` | `boolean` | If `true`, count all requests; otherwise only success (via interceptor) |

---

## 💾 Supported Storage Backends

- **Redis** — [ioredis](https://github.com/luin/ioredis)
- **Valkey** — [iovalkey](https://github.com/valkey-io/iovalkey)

---

## 🛠️ Issues and Contributing

Feel free to open [issues](https://github.com/khoativi/nestjs-rate-limit/issues) or submit pull requests for improvements, bug fixes.

## 📄 License

MIT License © [Khoa Trần](https://github.com/khoativi)
