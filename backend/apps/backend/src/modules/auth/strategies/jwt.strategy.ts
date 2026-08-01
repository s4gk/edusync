import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService, private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      algorithms: ['RS256'],
      secretOrKey: config.get<string>('JWT_PUBLIC_KEY')?.replace(/\\n/g, '\n'),
    });
  }

  async validate(payload: { sub: string; email: string; role: string; roles: string[] }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        firstName: true,
        lastName: true,
        isActive: true,
        mustChangePassword: true,
        deletedAt: true,
        userRoles: { select: { role: true } },
      },
    });

    if (!user || !user.isActive || user.deletedAt) throw new UnauthorizedException();

    const roles = [user.role, ...user.userRoles.map((r) => r.role)];
    const { userRoles: _, ...rest } = user;
    return { ...rest, roles };
  }
}
