import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './modules/validation/worker.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(WorkerModule);

  console.log('BullMQ Worker started successfully');

  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down worker...');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down worker...');
    await app.close();
    process.exit(0);
  });
}

bootstrap();
