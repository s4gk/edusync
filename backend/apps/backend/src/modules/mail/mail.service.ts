import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface CorreoAEnviar {
  para: string;
  asunto: string;
  html: string;
  texto: string;
}

/**
 * Envío de correo del colegio.
 *
 * Está APAGADO mientras no haya credenciales SMTP, y eso es un estado normal,
 * no un error: el resto del producto funciona igual. Cuando está apagado, en vez
 * de fallar deja el correo escrito en el log — así el flujo de recuperar
 * contraseña se puede probar de punta a punta (el enlace sale en los logs) antes
 * de tener servidor de correo.
 *
 * Para encenderlo: poner en `backend/.env` SMTP_HOST, SMTP_PORT, SMTP_USER,
 * SMTP_PASS y MAIL_FROM, y `pm2 restart edusync-backend`.
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger('Mail');
  private transporter: nodemailer.Transporter | null = null;

  /** ¿Hay credenciales configuradas? Lo consultan los servicios que informan al usuario. */
  get activo(): boolean {
    return this.transporter !== null;
  }

  get remitente(): string {
    return process.env.MAIL_FROM || 'EduSync <no-reply@localhost>';
  }

  onModuleInit(): void {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      this.logger.warn(
        'Sin credenciales SMTP: el correo queda APAGADO. Los mensajes se escribirán en el log en vez de enviarse. ' +
          'Para activarlo, definir SMTP_HOST/SMTP_USER/SMTP_PASS en backend/.env.',
      );
      return;
    }

    const port = Number(process.env.SMTP_PORT || 587);
    this.transporter = nodemailer.createTransport({
      host,
      port,
      // 465 es SMTPS (TLS desde el saludo). 587 y 25 arrancan en claro y suben a
      // TLS con STARTTLS, que nodemailer hace solo cuando secure=false.
      secure: port === 465,
      auth: { user, pass },
    });

    this.transporter
      .verify()
      .then(() => this.logger.log(`Correo listo vía ${host}:${port} como ${this.remitente}`))
      .catch((e) =>
        // No tumbamos el arranque: un SMTP mal configurado no puede dejar al
        // colegio sin poder pasar lista.
        this.logger.error(`El correo está configurado pero NO responde: ${(e as Error).message}`),
      );
  }

  /** Devuelve true si el correo salió de verdad. */
  async enviar(correo: CorreoAEnviar): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(
        `[CORREO APAGADO] Para: ${correo.para} · Asunto: ${correo.asunto}\n${correo.texto}`,
      );
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: this.remitente,
        to: correo.para,
        subject: correo.asunto,
        text: correo.texto,
        html: correo.html,
      });
      this.logger.log(`Correo enviado a ${correo.para}: ${correo.asunto}`);
      return true;
    } catch (e) {
      this.logger.error(`No se pudo enviar a ${correo.para}: ${(e as Error).message}`);
      return false;
    }
  }

  /** Restablecimiento de contraseña. `enlace` ya viene armado y con el token dentro. */
  async enviarRestablecerContrasena(para: string, nombre: string, enlace: string, minutos: number) {
    const colegio = process.env.SCHOOL_NAME || 'EduSync';
    return this.enviar({
      para,
      asunto: `${colegio} · Restablecer tu contraseña`,
      texto:
        `Hola ${nombre},\n\n` +
        `Recibimos una solicitud para restablecer la contraseña de tu cuenta en ${colegio}.\n\n` +
        `Abre este enlace para elegir una nueva contraseña:\n${enlace}\n\n` +
        `El enlace vence en ${minutos} minutos y solo se puede usar una vez.\n\n` +
        `Si no fuiste tú, puedes ignorar este mensaje: tu contraseña seguirá siendo la misma.`,
      html: plantilla(colegio, nombre, enlace, minutos),
    });
  }
}

function plantilla(colegio: string, nombre: string, enlace: string, minutos: number): string {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  return `<!doctype html>
<html lang="es"><body style="margin:0;padding:24px;background:#f5f5f4;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1c1917">
  <table role="presentation" style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e7e5e4">
    <tr><td style="padding:32px">
      <p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#78716c">${esc(colegio)}</p>
      <h1 style="margin:0 0 16px;font-size:20px;font-weight:600">Restablecer tu contraseña</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6">Hola ${esc(nombre)}, recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
      <p style="margin:0 0 24px"><a href="${esc(enlace)}" style="display:inline-block;background:#1c1917;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:15px;font-weight:500">Elegir nueva contraseña</a></p>
      <p style="margin:0 0 16px;font-size:13px;color:#78716c;line-height:1.6">El enlace vence en ${minutos} minutos y solo se puede usar una vez.</p>
      <p style="margin:0;font-size:13px;color:#78716c;line-height:1.6">Si no fuiste tú, puedes ignorar este mensaje: tu contraseña seguirá siendo la misma.</p>
    </td></tr>
  </table>
</body></html>`;
}
