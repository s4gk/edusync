import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const RESET_MINUTES = 60;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
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

  /**
   * Paso 1: pedir el enlace.
   *
   * Responde SIEMPRE lo mismo, exista o no la cuenta. Si distinguiera, este
   * endpoint sería un comprobador de correos: cualquiera podría averiguar qué
   * docentes y acudientes están registrados en el colegio probando direcciones.
   */
  async forgotPassword(email: string) {
    const respuesta = {
      message:
        'Si el correo corresponde a una cuenta activa, te enviamos un enlace para restablecer la contraseña.',
    };

    const user = await this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user || !user.isActive || user.deletedAt) return respuesta;

    // Invalidar los pedidos anteriores que sigan vivos: si alguien pide el
    // enlace tres veces, solo el último debe servir.
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_MINUTES * 60 * 1000);

    await this.prisma.passwordResetToken.create({ data: { tokenHash, userId: user.id, expiresAt } });

    const base = (process.env.PUBLIC_URL || 'http://localhost:3003').replace(/\/$/, '');
    const enlace = `${base}/restablecer?token=${token}`;
    await this.mail.enviarRestablecerContrasena(
      user.email,
      user.firstName || 'usuario',
      enlace,
      RESET_MINUTES,
    );

    return respuesta;
  }

  /** Paso 2: canjear el enlace por una contraseña nueva. */
  async resetPassword(token: string, newPassword: string) {
    if (!token || !newPassword || newPassword.length < 8) {
      throw new BadRequestException('La nueva contraseña debe tener al menos 8 caracteres.');
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');
    const registro = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!registro || registro.usedAt || registro.expiresAt < new Date()) {
      throw new BadRequestException(
        'El enlace no es válido o ya venció. Solicita uno nuevo desde "Olvidé mi contraseña".',
      );
    }
    if (!registro.user.isActive || registro.user.deletedAt) {
      throw new BadRequestException('La cuenta no está activa.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: registro.userId },
        data: {
          passwordHash,
          mustChangePassword: false,
          // Quien recupera la contraseña suele venir precisamente de haberse
          // bloqueado a fuerza de intentos: dejarlo bloqueado sería absurdo.
          loginAttempts: 0,
          lockUntil: null,
        },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: registro.id },
        data: { usedAt: new Date() },
      }),
      // Cerrar las sesiones abiertas. Si la contraseña se restablece porque la
      // cuenta estaba comprometida, dejar vivo el refresh token del atacante
      // haría inútil el cambio.
      this.prisma.refreshToken.deleteMany({ where: { userId: registro.userId } }),
    ]);

    return { message: 'Tu contraseña fue actualizada. Ya puedes iniciar sesión.' };
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
