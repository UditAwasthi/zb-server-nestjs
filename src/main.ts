import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";

import {env} from "./config/env";

import { AppModule } from "./app.module";

async function bootstrap() {
  const app =
    await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter(),
    );

  app.enableShutdownHooks();

  await app.listen({
    host: "0.0.0.0",
    port: env.PORT || 4000,
  });

  console.log(`Server Running on http://localhost:${env.PORT || 4000}`);
}

bootstrap();