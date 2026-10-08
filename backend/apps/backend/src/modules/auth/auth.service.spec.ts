import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    deleteMany: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('mock-token'),
  verify: jest.fn(),
};

const mockConfig = {
  get: jest.fn().mockReturnValue('some-value'),
};

// Helper: build a minimal valid user object
function buildUser(overrides: Partial<Record<string, any>> = {}) {
  return {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: 'hashed-pw',
    isActive: true,
    deletedAt: null,
    lockUntil: null,
    loginAttempts: 0,
    mustChangePassword: false,
    role: 'TEACHER',
    userRoles: [],
    ...overrides,
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let prisma: typeof mockPrisma;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── login() ──────────────────────────────────────────────────────────────

  describe('login()', () => {
    const dto = { email: 'test@example.com', password: 'secret' };

    it('should throw UnauthorizedException when user is not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(buildUser({ isActive: false }));

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException when account is locked (lockUntil in the future)', async () => {
      const lockUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 min from now
      mockPrisma.user.findUnique.mockResolvedValue(buildUser({ lockUntil }));

      await expect(service.login(dto)).rejects.toThrow(ForbiddenException);
    });

    it('should increment loginAttempts on wrong password (attempt 1)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(buildUser({ loginAttempts: 0 }));
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      mockPrisma.user.update.mockResolvedValue({});

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ loginAttempts: 1 }),
        }),
      );
      // lockUntil should NOT be set for attempt 1
      const callData = mockPrisma.user.update.mock.calls[0][0].data;
      expect(callData.lockUntil).toBeUndefined();
    });

    it('should lock the account after 5 failed attempts', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(buildUser({ loginAttempts: 4 }));
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      mockPrisma.user.update.mockResolvedValue({});

      await expect(service.login(dto)).rejects.toThrow(ForbiddenException);

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            loginAttempts: 5,
            lockUntil: expect.any(Date),
          }),
        }),
      );
    });

    it('should return accessToken, refreshToken and user on valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(buildUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await service.login(dto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
    });

    it('should reset loginAttempts to 0 on successful login', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(buildUser({ loginAttempts: 2 }));
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({});

      await service.login(dto);

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ loginAttempts: 0, lockUntil: null }),
        }),
      );
    });

    it('should not include passwordHash or loginAttempts in returned user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(buildUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await service.login(dto);

      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user).not.toHaveProperty('loginAttempts');
    });
  });

  // ─── changePassword() ─────────────────────────────────────────────────────

  describe('changePassword()', () => {
    it('should throw UnauthorizedException when current password is incorrect', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(buildUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.changePassword('user-1', 'wrong', 'new-pass')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return user with mustChangePassword=false on success', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(buildUser({ mustChangePassword: true }));
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrisma.user.update.mockResolvedValue({ id: 'user-1', mustChangePassword: false });

      const result = await service.changePassword('user-1', 'current', 'new-pass');

      expect(result).toEqual({ id: 'user-1', mustChangePassword: false });
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ mustChangePassword: false }),
        }),
      );
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.changePassword('missing-id', 'any', 'new')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ─── logout() ─────────────────────────────────────────────────────────────

  describe('logout()', () => {
    it('should call deleteMany on refreshToken with the provided token', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      await service.logout('some-refresh-token');

      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { token: 'some-refresh-token' },
      });
    });

    it('should not call deleteMany when token is empty', async () => {
      await service.logout('');

      expect(mockPrisma.refreshToken.deleteMany).not.toHaveBeenCalled();
    });
  });
});
