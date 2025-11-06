import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Configuration Service
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 4000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api');
  const allowedOrigins = configService.get<string>('ALLOWED_ORIGINS', 'http://localhost:3000');

  // Global Prefix
  app.setGlobalPrefix(apiPrefix);

  // CORS Configuration
  app.enableCors({
    origin: allowedOrigins.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Security Headers
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Désactivé pour permettre les uploads Cloudinary
  }));

  // Compression
  app.use(compression());

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Supprime les propriétés non définies dans les DTOs
      forbidNonWhitelisted: true, // Rejette les requêtes avec propriétés inconnues
      transform: true, // Transforme automatiquement les types
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Démarrage du serveur
  await app.listen(port, '0.0.0.0');

  console.log(`
    🚀 Spotlight Lover Backend démarré avec succès !
    
    📍 URL: http://localhost:${port}/${apiPrefix}
    🌍 Environment: ${configService.get('NODE_ENV')}
    🔒 CORS: ${allowedOrigins}
    
    📚 Documentation API: http://localhost:${port}/${apiPrefix}/docs (à venir)
  `);
}

bootstrap();
