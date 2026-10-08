import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Rate limit que sabe distinguir de verdad a quién está limitando.
 *
 * El guard de serie usa `req.ip`. Aquí eso no sirve: el navegador nunca habla
 * con este backend, habla con el front de Next, que reenvía a `/api` por su
 * proxy. Medido el 2026-08-04, ese proxy manda `x-forwarded-host` pero NO
 * `x-forwarded-for`, así que el backend ve TODAS las peticiones del colegio
 * como 127.0.0.1. Limitar por `req.ip` no protegería de nada y además
 * bloquearía a todos los usuarios a la vez en cuanto uno solo pasara del cupo
 * — peor que no tener límite.
 *
 * Orden de preferencia, del más específico al menos:
 *   1. El usuario autenticado (`sub` del JWT). Es lo que de verdad identifica a
 *      una persona, y sobrevive a cualquier proxy.
 *   2. `x-forwarded-for` real, cuando haya un nginx delante que sí lo ponga.
 *   3. `req.ip`, último recurso.
 *
 * La fuerza bruta contra UNA cuenta ya la corta `AuthService.login` (5 intentos
 * → 15 minutos de bloqueo). Esto es la otra mitad: el abuso general de la API.
 */
@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    if (req.user?.id) return `user:${req.user.id}`;

    const forwarded = req.headers?.['x-forwarded-for'];
    if (forwarded) {
      const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(',')[0].trim();
      if (first) return `ip:${first}`;
    }

    return `ip:${req.ip}`;
  }
}
