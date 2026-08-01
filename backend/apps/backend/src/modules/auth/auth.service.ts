import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { userRoles: { select: { role: true } } },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // RF-AUTH-04: check lockout
    if (user.lockUntil && user.lockUntil > new Date()) {
      const minutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      throw new ForbiddenException(`Cuenta bloqueada. Intente de nuevo en ${minutes} minuto(s)`);
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      const attempts = user.loginAttempts + 1;
      const lockUntil = attempts >= MAX_LOGIN_ATTEMPTS
        ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
        : null;

      await this.prisma.user.update({
        where: { id: user.id },
        data: { loginAttempts: attempts, ...(lockUntil ? { lockUntil } : {}) },
      });

      if (lockUntil) {
        throw new ForbiddenException(`Cuenta bloqueada por ${LOCK_MINUTES} minutos tras ${MAX_LOGIN_ATTEMPTS} intentos fallidos`);
      }

      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Reset lockout on successful login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockUntil: null },
    });

    const allRoles = [user.role, ...user.userRoles.map((r) => r.role)];
    const payload = { sub: user.id, email: user.email, role: user.role, roles: allRoles };

    const accessToken = this.jwt.sign(payload);
    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
      algorithm: 'RS256',
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } });

    const { passwordHash: _, loginAttempts: __, lockUntil: ___, userRoles: ____, ...safeUser } = user;
    return {
      accessToken,
      refreshToken,
      user: { ...safeUser, roles: allRoles },
      // RF-AUTH-05: flag front-end to redirect to change-password
      mustChangePassword: user.mustChangePassword,
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Contraseña actual incorrecta');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false },
      select: { id: true, mustChangePassword: true },
    });
  }

  async refreshTokens(token: string) {
    if (!token) throw new UnauthorizedException();

    const stored = await this.prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const payload = this.jwt.verify(token, {
      algorithms: ['RS256'],
      publicKey: this.config.get('JWT_PUBLIC_KEY')?.replace(/\\n/g, '\n'),
    }) as { sub: string; email: string; role: string; roles: string[] };

    await this.prisma.refreshToken.delete({ where: { token } });

    const newPayload = { sub: payload.sub, email: payload.email, role: payload.role, roles: payload.roles };
    const accessToken = this.jwt.sign(newPayload);
    const newRefreshToken = this.jwt.sign(newPayload, {
      secret: this.config.get('JWT_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
      algorithm: 'RS256',
      expiresIn: '7d',
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.prisma.refreshToken.create({ data: { token: newRefreshToken, userId: payload.sub, expiresAt } });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(token: string) {
    if (token) {
      await this.prisma.refreshToken.deleteMany({ where: { token } });
    }
  }
}
