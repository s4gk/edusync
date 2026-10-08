import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    app.setGlobalPrefix('api');

    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/auth/login', () => {
    it('returns 400 for missing credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({})
        .expect(400);
    });

    it('returns 401 for unknown user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nobody@nowhere.com', password: 'wrongpass' })
        .expect(401);
    });

    it('returns 401 for wrong password on existing user', async () => {
      // Seed a test user
      const bcrypt = await import('bcrypt');
      const passwordHash = await bcrypt.hash('correct-password', 10);
      const user = await prisma.user.create({
        data: {
          email: 'e2etest@school.co',
          firstName: 'Test',
          lastName: 'User',
          passwordHash,
          role: 'RECTOR',
          isActive: true,
        },
      });

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'e2etest@school.co', password: 'wrong-password' })
        .expect(401);

      await prisma.user.delete({ where: { id: user.id } });
    });

    it('returns 200 with tokens for valid credentials', async () => {
      const bcrypt = await import('bcrypt');
      const passwordHash = await bcrypt.hash('test-password-123', 10);
      const user = await prisma.user.create({
        data: {
          email: 'e2elogin@school.co',
          firstName: 'Login',
          lastName: 'Test',
          passwordHash,
          role: 'RECTOR',
          isActive: true,
        },
      });

      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'e2elogin@school.co', password: 'test-password-123' })
        .expect(200);

      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data.user.email).toBe('e2elogin@school.co');

      await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns 401 without token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);
    });
  });
});
