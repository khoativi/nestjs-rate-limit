import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(
    AppModule,
    //  new ExpressAdapter()
    new FastifyAdapter()
  );
  await app.listen(3000);
}
void bootstrap();
