import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerBehindProxyGuard } from './common/guards/throttler-behind-proxy.guard';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { StudentsModule } from './modules/students/students.module';
import { AcademicModule } from './modules/academic/academic.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { GradesModule } from './modules/grades/grades.module';
import { ObservationsModule } from './modules/observations/observations.module';
import { YearCloseModule } from './modules/year-close/year-close.module';
import { ReportCardsModule } from './modules/report-cards/report-cards.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CommunicationsModule } from './modules/communications/communications.module';
import { FinanceModule } from './modules/finance/finance.module';
import { ReportsModule } from './modules/reports/reports.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { JobsModule } from './jobs/jobs.module';
import { AuditModule } from './modules/audit/audit.module';
import { CoachModule } from './modules/coach/coach.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { GuardiansModule } from './modules/guardians/guardians.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { DriveModule } from './modules/drive/drive.module';
import { RemindersModule } from './modules/reminders/reminders.module';
import { MailModule } from './modules/mail/mail.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MailModule,
    // 300/min POR USUARIO (ver ThrottlerBehindProxyGuard). Holgado a propósito:
    // pantallas como Calificaciones (autoguardado) o En riesgo (una llamada por
    // materia) hacen ráfagas legítimas, y un límite que corta al docente en
    // mitad de la clase se acaba desactivando. 300/min sigue siendo inalcanzable
    // para una persona y corta el abuso automatizado.
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 300 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    StudentsModule,
    AcademicModule,
    AttendanceModule,
    GradesModule,
    ObservationsModule,
    YearCloseModule,
    ReportCardsModule,
    DashboardModule,
    CommunicationsModule,
    FinanceModule,
    ReportsModule,
    NotificationsModule,
    ScheduleModule,
    JobsModule,
    AuditModule,
    CoachModule,
    CertificatesModule,
    UploadsModule,
    GuardiansModule,
    TeachersModule,
    DriveModule,
    RemindersModule,
    ChatbotModule,
  ],
  // Sin esto el ThrottlerModule de arriba era decorativo: estaba configurado
  // pero ningún guard lo aplicaba, así que la API no tenía ningún límite.
  providers: [{ provide: APP_GUARD, useClass: ThrottlerBehindProxyGuard }],
})
export class AppModule {}
