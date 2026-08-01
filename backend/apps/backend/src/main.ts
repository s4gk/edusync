import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // helmet con CORP relajado para que el navegador pueda mostrar las fotos/PDF
  // subidos (servidos desde /api/uploads y consumidos vía el proxy de Next).
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cookieParser());

  // Archivos subidos: guardados en ./uploads, servidos bajo /api/uploads/*.
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/api/uploads/' });

  app.enableCors({
    origin: config.get<string>('FRONTEND_URL', 'http://localhost:5173'),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new AuditInterceptor(app.get(PrismaService)),
  );

  app.setGlobalPrefix('api');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('School Management API')
    .setDescription('API REST para gestión escolar colombiana')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`🚀 Backend running on http://localhost:${port}/api`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
