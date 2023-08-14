import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/exceptions/http-exception.filter';
import fastifyCookie from '@fastify/cookie';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  // const app = await NestFactory.create<NestFastifyApplication>(
  //   AppModule,
  //   new FastifyAdapter(),
  // );
  // await app.register(fastifyCookie, {
  //   secret: 'my-secret', // for cookies signature
  // });
  const app = await NestFactory.create(AppModule);
  //app.use(cookieParser());
  app.enableCors({ credentials: true });
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(3000);
}
bootstrap();
