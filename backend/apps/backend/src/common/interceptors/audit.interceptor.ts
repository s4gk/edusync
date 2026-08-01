import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

const AUDITED_ACTIONS: Record<string, string> = {
  'POST /auth/login': 'LOGIN',
  'POST /auth/logout': 'LOGOUT',
  'POST /users': 'USER_CREATE',
  'PUT /users': 'USER_UPDATE',
  'DELETE /users': 'USER_DELETE',
  'POST /users/:id/reset-password': 'USER_RESET_PASSWORD',
  'POST /academic/periods/:id/close': 'PERIOD_CLOSE',
  'POST /academic/periods/:id/reopen': 'PERIOD_REOPEN',
  'POST /grades': 'GRADE_CREATE',
  'PUT /grades': 'GRADE_UPDATE',
  'POST /finance/payments': 'PAYMENT_REGISTER',
  'POST /academic/years': 'YEAR_CREATE',
};

function resolveAction(method: string, path: string): string | null {
  const normalized = `${method} /${path.replace(/^\//, '').split('/').slice(0, 2).join('/')}`;
  for (const [pattern, action] of Object.entries(AUDITED_ACTIONS)) {
    const regex = new RegExp('^' + pattern.replace(/:[\w]+/g, '[^/]+') + '$');
    if (regex.test(`${method} ${path}`)) return action;
  }
  return AUDITED_ACTIONS[normalized] ?? null;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const action = resolveAction(req.method, req.path);

    if (!action || !req.user?.id) return next.handle();

    const ip = req.ip ?? req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];

    return next.handle().pipe(
      tap((responseBody) => {
        const entityId = responseBody?.id ?? responseBody?.data?.id ?? req.params?.id ?? null;
        this.prisma.auditLog
          .create({
            data: {
              userId: req.user.id,
              action,
              entity: this.resolveEntity(req.path),
              entityId,
              newValues: req.body && Object.keys(req.body).length ? this.sanitize(req.body) : undefined,
              ip,
              userAgent,
            },
          })
          .catch(() => {});
      }),
    );
  }

  private resolveEntity(path: string): string {
    const segment = path.split('/').filter(Boolean)[0] ?? 'unknown';
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  }

  private sanitize(body: Record<string, any>): Record<string, any> {
    const { password, passwordHash, ...safe } = body;
    return safe;
  }
}
