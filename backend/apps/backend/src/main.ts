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
  // `rawBody: true` conserva el cuerpo sin parsear. Lo necesita el webhook de
  // WhatsApp: la firma HMAC se calcula sobre los bytes exactos que envió Meta, y
  // un JSON re-serializado ya no coincide.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
  const config = app.get(ConfigService);

  // Detrás de nginx: hacer caso a X-Forwarded-For/Proto. Sin esto, req.ip es
  // siempre la del proxy y req.protocol siempre 'http' (con lo que la cookie
  // `secure` nunca se marcaría bien). Solo un salto de confianza: el nginx local.
  app.set('trust proxy', 1);

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

  // Escuchar SOLO en loopback. El navegador nunca habla con este proceso: entra
  // por el front de Next (:3003), que reenvía `/api` por su proxy. Antes de esto
  // el backend escuchaba en 0.0.0.0 y se llegaba a él desde internet en el
  // :5055 — con Swagger abierto y saltándose el guard de sesión del front.
  // `BIND_HOST=0.0.0.0` lo reabre si algún día el front vive en otra máquina.
  const host = config.get<string>('BIND_HOST', '127.0.0.1');
  await app.listen(port, host);
  console.log(`🚀 Backend running on http://${host}:${port}/api`);
  console.log(`📚 Swagger docs at http://${host}:${port}/api/docs`);
}

bootstrap();
