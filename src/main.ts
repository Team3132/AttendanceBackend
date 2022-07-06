import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import * as passport from 'passport';
import Redis from 'ioredis';
import * as connectRedis from 'connect-redis';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import type { ClientOpts } from 'redis';
import * as swStats from 'swagger-stats';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  app.use(cookieParser(config.getOrThrow('COOKIE_SECRET')));

  let redisClient = new Redis({
    host: config.get('REDIS_HOST'),
    port: parseInt(config.get('REDIS_PORT')),
    db: 0,
  });
  const redisStore = connectRedis(session);

  app.use(
    session({
      secret: config.get('SESSION_SECRET'),
      resave: false,
      saveUninitialized: false,
      store: new redisStore({
        client: redisClient,
      }),
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());
  // app.use(csurf());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      stopAtFirstError: false,
      transform: true,
    }),
  );
  const swaggerConfig = new DocumentBuilder()
    .setTitle('TDU Attendance API')
    .setDescription('TDU Attendance API for attending TDU')
    .addCookieAuth('connect.sid')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  // console.log(document);
  app.use(
    swStats.getMiddleware({
      swaggerSpec: document,
      onAuthenticate(req, username, password) {
        return (
          username === config.getOrThrow('STATS_USERNAME') &&
          password === config.getOrThrow('STATS_PASSWORD')
        );
      },
      authentication: true,
    }),
  );
  SwaggerModule.setup('api', app, document, {});

  await app.listen(3000);
}
bootstrap();
