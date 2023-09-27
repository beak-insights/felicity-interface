import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppInitService } from './providers/initiliser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    logger: ['error', 'warn', 'log', 'verbose', 'debug'],
  });
  app.setGlobalPrefix('/api');

  const config = new DocumentBuilder()
    .setTitle('Pal Dating Services API Docs')
    .setDescription('Pal API Documentation')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(
    process.env.BACKEND_SERVER_PORT || 5000,
    process.env.BACKEND_SERVER_HOST || '0.0.0.0',
  );
  setTimeout(() => {
    const appService = app.get(AppInitService);
    appService.initialize();
  }, 3000);
}
bootstrap();
