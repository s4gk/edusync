import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Registro de trazabilidad (RF-AUD).
 *
 * Estuvo escribiendo cero filas desde siempre por tres motivos que se corrigen
 * aquí:
 *
 *  1. Comparaba contra `req.path`, que incluye el prefijo global `/api`. Ningún
 *     patrón (`POST /auth/login`) podía coincidir con `/api/auth/login`, así que
 *     la tabla quedaba vacía y nadie lo notaba — que es justo el peor modo de
 *     fallar para una bitácora.
 *  2. Salía temprano si no había `req.user`, con lo que el **login** —el evento
 *     más importante que auditar en un colegio— nunca se registraba. Ahora el
 *     usuario del login se toma de la respuesta.
 *  3. `entity` salía del primer segmento de la ruta, que con el prefijo era
 *     siempre "Api".
 *
 * Se registra el "quién, qué y cuándo" de lo que cambia el expediente de un
 * estudiante o el dinero: notas, asistencia, observador, matrícula, cierres,
 * facturación, cuentas y consentimientos. Las lecturas no se registran (serían
 * ruido y volumen), salvo la expedición de certificados, que es un documento
 * que sale de la institución.
 */

type Regla = { method: string; pattern: RegExp; action: string; entity: string };

/** `:x` = un segmento. El orden importa: gana la primera que coincida. */
function r(method: string, path: string, action: string, entity: string): Regla {
  return {
    method,
    pattern: new RegExp('^' + path.replace(/:[\w]+/g, '[^/]+') + '$'),
    action,
    entity,
  };
}

const REGLAS: Regla[] = [
  // Sesión
  r('POST', '/auth/login', 'LOGIN', 'Sesión'),
  r('POST', '/auth/logout', 'LOGOUT', 'Sesión'),
  r('POST', '/auth/change-password', 'PASSWORD_CHANGE', 'Sesión'),

  // Cuentas
  r('POST', '/users/:id/reset-password', 'PASSWORD_RESET', 'Usuario'),
  r('POST', '/users', 'USER_CREATE', 'Usuario'),
  r('PUT', '/users/:id', 'USER_UPDATE', 'Usuario'),
  r('DELETE', '/users/:id', 'USER_DELETE', 'Usuario'),

  // Estudiantes y matrícula
  r('POST', '/students', 'STUDENT_CREATE', 'Estudiante'),
  r('PUT', '/students/:id', 'STUDENT_UPDATE', 'Estudiante'),
  r('DELETE', '/students/:id', 'STUDENT_DELETE', 'Estudiante'),
  r('POST', '/guardians', 'GUARDIAN_CREATE', 'Acudiente'),

  // Notas — lo que más se reclama
  r('POST', '/grades/scores', 'GRADE_SCORE_SAVE', 'Calificación'),
  r('POST', '/grades/achievements', 'ACHIEVEMENT_CREATE', 'Calificación'),
  r('PUT', '/grades/achievements/:id', 'ACHIEVEMENT_UPDATE', 'Calificación'),
  r('DELETE', '/grades/achievements/:id', 'ACHIEVEMENT_DELETE', 'Calificación'),
  r('POST', '/grades/activities', 'ACTIVITY_CREATE', 'Calificación'),
  r('PUT', '/grades/activities/:id', 'ACTIVITY_UPDATE', 'Calificación'),
  r('DELETE', '/grades/activities/:id', 'ACTIVITY_DELETE', 'Calificación'),

  // Asistencia y observador
  r('POST', '/attendance', 'ATTENDANCE_SAVE', 'Asistencia'),
  r('POST', '/attendance/bulk', 'ATTENDANCE_SAVE', 'Asistencia'),
  r('POST', '/observations', 'OBSERVATION_CREATE', 'Observador'),
  r('PUT', '/observations/:id', 'OBSERVATION_UPDATE', 'Observador'),
  r('DELETE', '/observations/:id', 'OBSERVATION_DELETE', 'Observador'),

  // Estructura académica y cierres — irreversibles o casi
  r('POST', '/academic/years', 'YEAR_CREATE', 'Año lectivo'),
  r('PUT', '/academic/years/:id', 'YEAR_UPDATE', 'Año lectivo'),
  r('POST', '/academic/periods/:id/close', 'PERIOD_CLOSE', 'Periodo'),
  r('POST', '/academic/periods/:id/reopen', 'PERIOD_REOPEN', 'Periodo'),
  r('POST', '/academic/periods', 'PERIOD_CREATE', 'Periodo'),
  r('PUT', '/academic/periods/:id', 'PERIOD_UPDATE', 'Periodo'),
  r('POST', '/academic/grade-scales', 'GRADE_SCALE_SET', 'Escala de valoración'),
  r('POST', '/academic/groups', 'GROUP_CREATE', 'Curso'),
  r('PUT', '/academic/groups/:id', 'GROUP_UPDATE', 'Curso'),
  r('DELETE', '/academic/groups/:id', 'GROUP_DELETE', 'Curso'),
  r('POST', '/academic/subjects', 'SUBJECT_CREATE', 'Materia'),
  r('PUT', '/academic/subjects/:id', 'SUBJECT_UPDATE', 'Materia'),
  r('DELETE', '/academic/subjects/:id', 'SUBJECT_DELETE', 'Materia'),

  // Boletines y documentos que salen de la institución
  r('PUT', '/report-cards/:id/publish', 'REPORT_CARD_PUBLISH', 'Boletín'),
  r('POST', '/report-cards/generate/group/:id', 'REPORT_CARD_GENERATE', 'Boletín'),
  r('GET', '/certificates/:type/:id', 'CERTIFICATE_ISSUE', 'Certificado'),

  // Dinero
  r('POST', '/finance/payments', 'PAYMENT_REGISTER', 'Pago'),
  r('POST', '/finance/invoices/generate', 'INVOICE_GENERATE', 'Facturación'),
  r('POST', '/finance/tuition', 'TUITION_SET', 'Tarifas'),

  // Habeas data y configuración institucional
  r('POST', '/privacy/consents/:id/revoke', 'CONSENT_REVOKE', 'Habeas data'),
  r('POST', '/privacy/consents', 'CONSENT_REGISTER', 'Habeas data'),
  r('PUT', '/settings/school', 'SETTINGS_UPDATE', 'Configuración'),

  // Comunicaciones
  r('POST', '/communications/announcements/:id/publish', 'ANNOUNCEMENT_PUBLISH', 'Comunicado'),
  r('DELETE', '/communications/announcements/:id', 'ANNOUNCEMENT_DELETE', 'Comunicado'),
];

/** Campos que nunca deben quedar escritos en la bitácora. */
const SENSIBLES = new Set([
  'password', 'passwordHash', 'currentPassword', 'newPassword',
  'temporaryPassword', 'accessToken', 'refreshToken',
]);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') return next.handle();

    const req = context.switchToHttp().getRequest();
    // `req.path` trae el prefijo global (/api). Se quita para que los patrones
    // se escriban como las rutas de los controladores.
    const path: string = (req.path ?? req.url ?? '').split('?')[0].replace(/^\/api(?=\/|$)/, '');
    const regla = REGLAS.find((x) => x.method === req.method && x.pattern.test(path));
    if (!regla) return next.handle();

    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip;
    const userAgent = req.headers['user-agent'];
    const body = req.body;

    return next.handle().pipe(
      tap((responseBody) => {
        const payload = responseBody?.data ?? responseBody;
        // En el login todavía no hay req.user: el actor sale de la respuesta.
        const userId: string | undefined = req.user?.id ?? payload?.user?.id;
        if (!userId) return;

        this.prisma.auditLog
          .create({
            data: {
              userId,
              action: regla.action,
              entity: regla.entity,
              entityId: payload?.id ?? req.params?.id ?? null,
              newValues: this.sanitize(body),
              ip,
              userAgent,
            },
          })
          // Una bitácora caída no puede tumbar la operación del colegio.
          .catch(() => {});
      }),
    );
  }

  /** Deja fuera credenciales y recorta lo muy grande (guardar notas manda la
   *  matriz entera; con el tamaño basta para saber qué pasó). */
  private sanitize(body: unknown): any {
    if (!body || typeof body !== 'object') return undefined;
    const entries = Object.entries(body as Record<string, unknown>).filter(
      ([k]) => !SENSIBLES.has(k),
    );
    if (!entries.length) return undefined;

    const out: Record<string, unknown> = {};
    for (const [k, v] of entries) {
      out[k] = Array.isArray(v) && v.length > 20 ? `[${v.length} elementos]` : v;
    }
    const json = JSON.stringify(out);
    return json.length > 4000 ? { resumen: `${json.slice(0, 400)}…`, bytes: json.length } : out;
  }
}
