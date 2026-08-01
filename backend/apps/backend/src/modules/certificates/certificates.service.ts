import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const SCHOOL = process.env.SCHOOL_NAME || 'Colegio San Mateo';
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

type StudentFull = Awaited<ReturnType<CertificatesService['loadStudent']>>;

/**
 * Genera certificados/constancias en PDF bajo demanda (sin cola ni storage):
 * arma el HTML, lo renderiza con Puppeteer y devuelve el buffer para hacer
 * streaming en la respuesta. Si Puppeteer no está disponible, cae a HTML.
 */
@Injectable()
export class CertificatesService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(type: string, studentId: string) {
    const student = await this.loadStudent(studentId);
    if (!student) throw new NotFoundException('Estudiante no encontrado');

    let html: string;
    let slug: string;
    switch (type) {
      case 'estudio': html = this.constanciaEstudio(student); slug = 'constancia-estudio'; break;
      case 'notas': html = await this.certificadoNotas(student); slug = 'certificado-notas'; break;
      case 'paz-y-salvo': html = await this.pazYSalvo(student); slug = 'paz-y-salvo'; break;
      default: throw new BadRequestException('Tipo de certificado inválido.');
    }

    const rendered = await this.render(html);
    const code = student.enrollmentCode || studentId.slice(0, 8);
    return { ...rendered, filename: `${slug}_${code}.${rendered.ext}` };
  }

  private loadStudent(studentId: string) {
    return this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { firstName: true, lastName: true } },
        gradeGroup: { include: { academicYear: true } },
      },
    });
  }

  private hoy(): string {
    const d = new Date();
    return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
  }

  private nombre(s: StudentFull): string {
    return `${s!.user.firstName} ${s!.user.lastName}`;
  }

  private constanciaEstudio(s: StudentFull): string {
    const grupo = s!.gradeGroup?.name ?? '—';
    const year = s!.gradeGroup?.academicYear?.year ?? '';
    return this.wrap(
      'CONSTANCIA DE ESTUDIO',
      `<p>La institución educativa <b>${SCHOOL}</b> hace constar que el(la) estudiante
      <b>${this.nombre(s)}</b>, identificado(a) con documento N.° <b>${s!.documentId}</b>
      y código de matrícula <b>${s!.enrollmentCode}</b>, se encuentra matriculado(a) y cursando el grado
      <b>${grupo}</b> durante el año lectivo <b>${year}</b>.</p>
      <p>La presente constancia se expide a solicitud del interesado, a los ${this.hoy()}.</p>`,
    );
  }

  private async certificadoNotas(s: StudentFull): Promise<string> {
    const records = await this.prisma.gradeRecord.findMany({
      where: { studentId: s!.id },
      include: { subject: { select: { name: true } } },
    });
    const bySubject = new Map<string, { sum: number; n: number }>();
    for (const r of records) {
      const k = r.subject.name;
      const e = bySubject.get(k) ?? { sum: 0, n: 0 };
      e.sum += Number(r.score);
      e.n += 1;
      bySubject.set(k, e);
    }
    const subjects = [...bySubject.entries()].map(([name, { sum, n }]) => ({ name, avg: sum / n }));
    const promedio = subjects.length ? subjects.reduce((a, b) => a + b.avg, 0) / subjects.length : null;

    const rows = subjects
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((x) => `<tr><td>${x.name}</td><td style="text-align:center">${x.avg.toFixed(1)}</td><td style="text-align:center">${this.escala(x.avg)}</td></tr>`)
      .join('');

    const grupo = s!.gradeGroup?.name ?? '—';
    const year = s!.gradeGroup?.academicYear?.year ?? '';
    const body = subjects.length
      ? `<p>El(la) estudiante <b>${this.nombre(s)}</b> (documento <b>${s!.documentId}</b>), del grado
         <b>${grupo}</b>, año lectivo <b>${year}</b>, obtuvo las siguientes calificaciones:</p>
         <table>
           <thead><tr><th>Área / Asignatura</th><th style="text-align:center">Promedio</th><th style="text-align:center">Desempeño</th></tr></thead>
           <tbody>${rows}</tbody>
           ${promedio != null ? `<tfoot><tr><td><b>Promedio general</b></td><td style="text-align:center"><b>${promedio.toFixed(1)}</b></td><td style="text-align:center"><b>${this.escala(promedio)}</b></td></tr></tfoot>` : ''}
         </table>
         <p>Promedio en escala de 1.0 a 5.0. Se expide a los ${this.hoy()}.</p>`
      : `<p>El(la) estudiante <b>${this.nombre(s)}</b> no tiene calificaciones registradas a la fecha (${this.hoy()}).</p>`;

    return this.wrap('CERTIFICADO DE CALIFICACIONES', body);
  }

  private async pazYSalvo(s: StudentFull): Promise<string> {
    const pendientes = await this.prisma.invoice.count({
      where: { studentId: s!.id, status: { in: ['PENDING', 'OVERDUE'] } },
    });
    const grupo = s!.gradeGroup?.name ?? '—';
    const body = pendientes > 0
      ? `<p>Una vez revisado el estado financiero del(la) estudiante <b>${this.nombre(s)}</b>
         (grado <b>${grupo}</b>), se informa que <b>NO se encuentra a paz y salvo</b>: registra
         <b>${pendientes}</b> ${pendientes === 1 ? 'obligación pendiente' : 'obligaciones pendientes'} por concepto de pensión.</p>
         <p>Documento informativo expedido a los ${this.hoy()}.</p>`
      : `<p>La institución educativa <b>${SCHOOL}</b> hace constar que el(la) estudiante
         <b>${this.nombre(s)}</b>, del grado <b>${grupo}</b>, <b>se encuentra a PAZ Y SALVO</b>
         por todo concepto financiero con la institución a la fecha.</p>
         <p>Se expide a solicitud del interesado, a los ${this.hoy()}.</p>`;
    return this.wrap('PAZ Y SALVO', body);
  }

  private escala(v: number): string {
    if (v >= 4.6) return 'Superior';
    if (v >= 4.0) return 'Alto';
    if (v >= 3.0) return 'Básico';
    return 'Bajo';
  }

  private wrap(title: string, body: string): string {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
      body { font-family: 'Georgia', 'Times New Roman', serif; color: #1f2937; margin: 0; padding: 0; line-height: 1.7; }
      .sheet { padding: 8px 4px; }
      .head { text-align: center; border-bottom: 3px double #1a365d; padding-bottom: 16px; margin-bottom: 32px; }
      .school { font-size: 22px; font-weight: bold; color: #1a365d; letter-spacing: .5px; }
      .sub { font-size: 12px; color: #6b7280; margin-top: 4px; }
      h1 { font-size: 18px; text-align: center; letter-spacing: 3px; color: #1a365d; margin: 28px 0; }
      p { font-size: 14px; text-align: justify; margin: 14px 0; }
      table { width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 13px; }
      th { background: #1a365d; color: #fff; padding: 8px 10px; text-align: left; }
      td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; }
      tfoot td { border-top: 2px solid #1a365d; }
      .firma { margin-top: 70px; text-align: center; }
      .firma .line { width: 260px; margin: 0 auto; border-top: 1px solid #1f2937; padding-top: 6px; font-size: 13px; }
      .firma .role { font-size: 12px; color: #6b7280; }
      .foot { margin-top: 40px; text-align: center; font-size: 10px; color: #9ca3af; }
    </style></head><body><div class="sheet">
      <div class="head">
        <div class="school">${SCHOOL}</div>
        <div class="sub">NIT 900.000.000-0 · Aprobado por la Secretaría de Educación · Resolución N.° 0000</div>
      </div>
      <h1>${title}</h1>
      ${body}
      <div class="firma">
        <div class="line">Secretaría Académica</div>
        <div class="role">${SCHOOL}</div>
      </div>
      <div class="foot">Documento generado electrónicamente por el Sistema de Gestión Escolar Edusync.</div>
    </div></body></html>`;
  }

  private async render(html: string): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '25mm', bottom: '20mm', left: '22mm', right: '22mm' } });
      await browser.close();
      return { buffer: Buffer.from(pdf), contentType: 'application/pdf', ext: 'pdf' };
    } catch {
      return { buffer: Buffer.from(html, 'utf-8'), contentType: 'text/html; charset=utf-8', ext: 'html' };
    }
  }
}
