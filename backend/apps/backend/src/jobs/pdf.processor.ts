import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import * as path from 'path';
import * as fs from 'fs/promises';
import { PrismaService } from '../prisma/prisma.service';

@Processor('pdf')
export class PdfProcessor {
  private readonly logger = new Logger(PdfProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  @Process('report-card')
  async handleReportCard(job: Job<{ studentId: string; gradeGroupId: string; periodNumber: number; requestedBy: string }>) {
    const { studentId, gradeGroupId, periodNumber } = job.data;
    this.logger.log(`Generating report card: student=${studentId} period=${periodNumber}`);

    try {
      const data = await this.buildReportCardData(studentId, periodNumber);
      const html = this.buildHtml(data);
      const pdfUrl = await this.generatePdf(html, `rc_${studentId}_p${periodNumber}`);

      // Update report card record with generated PDF URL
      await this.prisma.reportCard.upsert({
        where: { studentId_gradeGroupId_period: { studentId, gradeGroupId, period: `P${periodNumber}` as any } },
        create: { studentId, gradeGroupId, period: `P${periodNumber}` as any, pdfUrl, generatedAt: new Date() },
        update: { pdfUrl, generatedAt: new Date() },
      });

      this.logger.log(`Report card generated: ${pdfUrl}`);
    } catch (err) {
      this.logger.error(`Failed to generate report card for ${studentId}: ${err.message}`);
      throw err;
    }
  }

  private async buildReportCardData(studentId: string, periodNumber: number) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { firstName: true, lastName: true } },
        gradeGroup: {
          include: {
            academicYear: true,
            subjects: {
              include: {
                teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
              },
            },
          },
        },
      },
    });

    const gradeRecords = await this.prisma.gradeRecord.findMany({
      where: { studentId, period: `P${periodNumber}` as any },
      include: { subject: { select: { name: true } } },
    });

    const attendanceStats = await Promise.all(
      (student?.gradeGroup?.subjects ?? []).map(async (subj) => {
        const records = await this.prisma.attendance.findMany({ where: { studentId, subjectId: subj.id } });
        const total = records.length;
        const absent = records.filter((r) => r.status === 'ABSENT').length;
        const late = records.filter((r) => r.status === 'LATE').length;
        const pct = total ? Math.round(((total - absent - late * 0.5) / total) * 100) : 100;
        return { subjectName: subj.name, total, absent, late, percentage: pct };
      }),
    );

    const observations = await this.prisma.observation.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
      take: 5,
    });

    return { student, gradeRecords, attendanceStats, observations, periodNumber };
  }

  private buildHtml(data: any): string {
    const { student, gradeRecords, attendanceStats, observations, periodNumber } = data;
    const name = `${student.user.firstName} ${student.user.lastName}`;
    const group = student.gradeGroup?.name ?? '';
    const year = student.gradeGroup?.academicYear?.year ?? '';

    const gradesRows = gradeRecords
      .map(
        (r: any) =>
          `<tr><td>${r.subject.name}</td><td>${Number(r.score).toFixed(1)}</td><td>${r.scale}</td></tr>`,
      )
      .join('');

    const attendanceRows = attendanceStats
      .map(
        (a: any) =>
          `<tr><td>${a.subjectName}</td><td>${a.total}</td><td>${a.absent}</td><td>${a.late}</td><td>${a.percentage}%</td></tr>`,
      )
      .join('');

    const obsItems = observations.map((o: any) => `<li>[${o.type}] ${o.content}</li>`).join('');

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
  h1 { color: #1a365d; text-align: center; }
  h2 { color: #2c5282; border-bottom: 2px solid #2c5282; padding-bottom: 4px; }
  .header { text-align: center; margin-bottom: 30px; }
  .info { display: flex; gap: 20px; margin-bottom: 20px; }
  .info span { font-weight: bold; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { background: #2c5282; color: white; padding: 8px; text-align: left; }
  td { padding: 7px 8px; border-bottom: 1px solid #e2e8f0; }
  tr:nth-child(even) td { background: #f7fafc; }
  .SUPERIOR { color: #276749; font-weight: bold; }
  .ALTO { color: #2b6cb0; font-weight: bold; }
  .BASICO { color: #c05621; font-weight: bold; }
  .BAJO { color: #c53030; font-weight: bold; }
  .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #718096; }
</style>
</head>
<body>
  <div class="header">
    <h1>BOLETÍN DE CALIFICACIONES</h1>
    <p>Periodo ${periodNumber} — Año ${year}</p>
  </div>
  <div class="info">
    <p>Estudiante: <span>${name}</span></p>
    <p>Grupo: <span>${group}</span></p>
  </div>

  <h2>Calificaciones</h2>
  <table>
    <thead><tr><th>Materia</th><th>Nota</th><th>Desempeño</th></tr></thead>
    <tbody>${gradesRows}</tbody>
  </table>

  <h2>Asistencia</h2>
  <table>
    <thead><tr><th>Materia</th><th>Clases</th><th>Faltas</th><th>Retardos</th><th>% Asistencia</th></tr></thead>
    <tbody>${attendanceRows}</tbody>
  </table>

  ${
    observations.length
      ? `<h2>Observaciones</h2><ul>${obsItems}</ul>`
      : ''
  }

  <div class="footer">
    <p>Documento generado automáticamente — Sistema de Gestión Escolar</p>
  </div>
</body>
</html>`;
  }

  private async generatePdf(html: string, filename: string): Promise<string> {
    const outputDir = path.join(process.cwd(), 'uploads', 'report-cards');
    await fs.mkdir(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, `${filename}_${Date.now()}.pdf`);

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      await page.pdf({ path: outputPath, format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' } });
      await browser.close();
    } catch {
      // Puppeteer not available in test env — save HTML instead
      await fs.writeFile(outputPath.replace('.pdf', '.html'), html);
      return `/uploads/report-cards/${path.basename(outputPath.replace('.pdf', '.html'))}`;
    }

    return `/uploads/report-cards/${path.basename(outputPath)}`;
  }
}
