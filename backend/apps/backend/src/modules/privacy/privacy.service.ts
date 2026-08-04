import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateConsentDto } from './dto/consent.dto';
import { FINALIDADES, POLICY_VERSION, politica } from './privacy.policy';

const CLAVES_VALIDAS = new Set(FINALIDADES.map((f) => f.key));

@Injectable()
export class PrivacyService {
  constructor(private readonly prisma: PrismaService) {}

  politicaVigente() {
    return politica();
  }

  async registrar(dto: CreateConsentDto, meta: { ip?: string; userAgent?: string }) {
    const titular = await this.prisma.user.findUnique({
      where: { id: dto.subjectUserId },
      select: { id: true, student: { select: { birthDate: true } } },
    });
    if (!titular) throw new NotFoundException('No existe el titular de los datos');

    const desconocidas = dto.purposes.filter((p) => !CLAVES_VALIDAS.has(p));
    if (desconocidas.length) {
      throw new BadRequestException(`Finalidad no reconocida: ${desconocidas.join(', ')}`);
    }
    // Una autorización sin finalidad no autoriza nada; guardarla daría una
    // falsa sensación de cumplimiento en el tablero.
    if (!dto.purposes.length) {
      throw new BadRequestException('Debe aceptarse al menos una finalidad');
    }

    // La minoría de edad no se acepta como la manda el formulario: se calcula
    // contra la fecha de nacimiento cuando existe. Es lo que decide si la
    // autorización debía darla un representante legal.
    const isMinor = titular.student?.birthDate
      ? esMenor(titular.student.birthDate)
      : (dto.isMinor ?? false);

    return this.prisma.dataConsent.create({
      data: {
        subjectUserId: dto.subjectUserId,
        policyVersion: POLICY_VERSION,
        purposes: dto.purposes,
        sensitiveDataAccepted: dto.sensitiveDataAccepted ?? false,
        imageRightsAccepted: dto.imageRightsAccepted ?? false,
        isMinor,
        signedByUserId: dto.signedByUserId ?? null,
        signedByName: dto.signedByName,
        signedByRole: dto.signedByRole,
        signedByDocument: dto.signedByDocument ?? null,
        channel: dto.channel ?? 'web',
        ipAddress: meta.ip ?? null,
        userAgent: meta.userAgent?.slice(0, 300) ?? null,
      },
    });
  }

  /**
   * Quién puede leer el expediente de autorizaciones de un titular.
   *
   * El historial no es un dato inocuo: trae el nombre y el documento de quien
   * firmó y la IP desde donde se hizo. Sin este filtro, cualquier acudiente o
   * estudiante autenticado podría leer el de cualquier otra familia con solo
   * cambiar el id de la URL —y en el módulo de protección de datos eso sería
   * exactamente la fuga que viene a evitar.
   */
  async assertAcceso(subjectUserId: string, actor: { id: string; roles?: string[]; role?: string }) {
    const roles = actor.roles ?? (actor.role ? [actor.role] : []);
    const staff = [
      'SUPER_ADMIN',
      'RECTOR',
      'COORDINATOR_ACADEMIC',
      'COORDINATOR_CONVIVENCIA',
      'SECRETARY',
    ];
    if (roles.some((r) => staff.includes(r))) return;
    // El titular siempre puede ver el suyo: es un derecho, no una concesión.
    if (subjectUserId === actor.id) return;

    // El acudiente, además, el de los estudiantes que tiene a cargo.
    if (roles.includes('GUARDIAN')) {
      const vinculo = await this.prisma.studentGuardian.findFirst({
        where: {
          guardian: { userId: actor.id },
          student: { userId: subjectUserId },
        },
        select: { studentId: true },
      });
      if (vinculo) return;
    }

    throw new ForbiddenException('No puede consultar las autorizaciones de otro titular');
  }

  /** Historial completo del titular: la autorización vigente y las anteriores.
   *  El historial es parte de la prueba, no ruido. */
  async historial(subjectUserId: string) {
    const consents = await this.prisma.dataConsent.findMany({
      where: { subjectUserId },
      orderBy: { acceptedAt: 'desc' },
    });
    const vigente = consents.find((c) => !c.revokedAt && c.policyVersion === POLICY_VERSION);
    return {
      vigente: vigente ?? null,
      /** Firmado bajo una versión anterior de la política: sigue siendo válido
       *  como prueba, pero hay que volver a pedir autorización. */
      desactualizado: !vigente && consents.some((c) => !c.revokedAt),
      historial: consents,
      versionVigente: POLICY_VERSION,
    };
  }

  async revocar(id: string, reason?: string) {
    const c = await this.prisma.dataConsent.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('No existe esa autorización');
    if (c.revokedAt) throw new BadRequestException('Esa autorización ya estaba revocada');
    return this.prisma.dataConsent.update({
      where: { id },
      data: { revokedAt: new Date(), revokedReason: reason ?? null },
    });
  }

  /**
   * Tablero de cumplimiento: quién tiene autorización vigente y quién no.
   * Sin esto la funcionalidad no sirve para nada — el colegio necesita saber a
   * qué familias le falta pedirles la firma, no solo poder guardarla.
   */
  async cumplimiento(role?: string) {
    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        status: 'ACTIVE',
        ...(role ? { role: role as any } : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        dataConsents: {
          where: { revokedAt: null },
          orderBy: { acceptedAt: 'desc' },
          take: 1,
          select: { id: true, acceptedAt: true, policyVersion: true, signedByName: true },
        },
      },
      orderBy: [{ role: 'asc' }, { lastName: 'asc' }],
    });

    const filas = users.map((u) => {
      const c = u.dataConsents[0];
      const estado = !c
        ? 'SIN_AUTORIZACION'
        : c.policyVersion !== POLICY_VERSION
          ? 'DESACTUALIZADA'
          : 'VIGENTE';
      return {
        userId: u.id,
        nombre: `${u.firstName} ${u.lastName}`,
        email: u.email,
        role: u.role,
        estado,
        acceptedAt: c?.acceptedAt ?? null,
        policyVersion: c?.policyVersion ?? null,
        signedByName: c?.signedByName ?? null,
      };
    });

    return {
      versionVigente: POLICY_VERSION,
      total: filas.length,
      vigentes: filas.filter((f) => f.estado === 'VIGENTE').length,
      desactualizadas: filas.filter((f) => f.estado === 'DESACTUALIZADA').length,
      sinAutorizacion: filas.filter((f) => f.estado === 'SIN_AUTORIZACION').length,
      filas,
    };
  }
}

function esMenor(birthDate: Date) {
  const hoy = new Date();
  let edad = hoy.getFullYear() - birthDate.getFullYear();
  const m = hoy.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < birthDate.getDate())) edad--;
  return edad < 18;
}
