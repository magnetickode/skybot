import { NestFactory } from '@nestjs/core';
import { config as configureEnv } from 'dotenv';
import { setMaxListeners } from 'events';
configureEnv();

import { AppModule } from './app.module';

async function bootstrap() {
  setMaxListeners(0);
  const app = await NestFactory.create(AppModule);

  await app.listen(4000);
}
bootstrap();
