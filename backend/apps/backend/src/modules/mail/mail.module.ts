import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';

/**
 * Global a propósito: el correo lo va a necesitar cualquier módulo (auth hoy,
 * comunicaciones y finanzas mañana) y no aporta nada obligar a cada uno a
 * importarlo. No tiene dependencias, así que no puede cerrar ciclos.
 */
@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
