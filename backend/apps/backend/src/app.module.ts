import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
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
  ],
})
export class AppModule {}
