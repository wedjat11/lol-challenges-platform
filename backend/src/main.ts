import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AppConfig, AuthConfig } from './config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const appConfig = configService.get<AppConfig>('app');
  const authConfig = configService.get<AuthConfig>('auth');

  if (!appConfig || !authConfig) {
    throw new Error('Configuration not loaded properly');
  }

  // Security
  app.use(helmet());
  app.use(cookieParser(authConfig.cookieSecret));

  // CORS
  app.enableCors({
    origin: authConfig.corsOrigin,
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix(appConfig.apiPrefix);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation (only in development)
  if (appConfig.nodeEnv === 'development') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('LoL Challenge Platform API')
      .setDescription('API for LoL competitive challenges platform')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(appConfig.port);

  console.log(
    `Application is running on: http://localhost:${appConfig.port}/${appConfig.apiPrefix}`,
  );
  if (appConfig.nodeEnv === 'development') {
    console.log(`Swagger docs available at: http://localhost:${appConfig.port}/docs`);
  }
}

bootstrap();
