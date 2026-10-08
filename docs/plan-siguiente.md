# EduSync — qué falta y en qué orden

> Estado al **7 de agosto de 2026**, después de la revisión completa del sistema.
> Todo lo que sigue está verificado contra el código y el servidor, no supuesto.
> Cada punto dice qué pasa hoy, qué hay que hacer y qué necesito de ti.

---

## Cómo leer esto

- **Bloqueado por ti** = necesito una decisión, una credencial o permisos que no tengo.
- **Listo para arrancar** = puedo hacerlo sin preguntarte nada más.
- El tamaño es relativo: **S** = un rato, **M** = una sesión, **L** = varias sesiones.

---

## Prioridad 1 — Lo que impide operar

### 1.1 El boletín no se puede imprimir · M · Listo para arrancar

**Hoy:** `report-cards` tiene generar, publicar y listar, pero **ningún endpoint de
PDF**. Las constancias sí lo tienen (Puppeteer, `modules/certificates`); el boletín
no. Es el documento que más pide una familia y solo existe en pantalla.

**Qué hacer:**
- `GET /api/report-cards/:id/pdf` reusando el pipeline de `certificates.service.ts`.
- Plantilla con formato del **Decreto 1290**: áreas con intensidad horaria,
  nota y desempeño por periodo, inasistencias, observaciones, puesto opcional,
  y el encabezado institucional que ya sale de Configuración.
- Descarga individual desde `/boletines` y **por grupo en un solo PDF** (es como
  se entrega en la práctica).

**Ojo:** la escala de valoración ya es configurable, así que el desempeño impreso
debe salir de ahí y no de la tabla quemada.

---

### 1.2 La matrícula formal nunca se crea · M · Listo para arrancar

**Hoy:** el asistente de `/matriculas/nuevo` crea el `Student` y nada más.
`createEnrollment` existe en el backend y **no lo llama nadie**. Consecuencias
reales:

- No hay estado de matrícula (prematriculada → formalizada).
- **No se puede retirar ni trasladar a un estudiante.** El endpoint existe
  (`PUT /students/enrollments/:id/status`, exige motivo) y no tiene pantalla.
- No hay renovación para el año siguiente.
- El KPI "matrículas activas" del panel solo cuenta lo que sembró el seed.
- La promoción que construimos mueve el curso pero **tampoco crea la matrícula
  del año nuevo** — quedó a medias por esto mismo.

**Qué hacer:**
- Que el asistente cree `Enrollment` junto con el `Student`.
- Pantalla de estado en la ficha del estudiante: formalizar, retirar, trasladar
  (con motivo obligatorio, que ya exige el backend).
- Enganchar la promoción para que genere las matrículas del año destino.
- Que el retiro saque al estudiante de los listados activos sin borrar su historia.

---

### 1.3 No está publicado · M · **Bloqueado por ti**

**Hoy:** nginx sirve `agrotech`, `nexonet`, `startv` y `vestel`. **No hay sitio
para edusync.** El `backend/nginx/nginx.conf` del repo es una plantilla de
docker-compose que apunta a `backend:3000` y `frontend:80`, puertos que no
existen en este despliegue (son 5055 y 3003). El sistema hoy solo vive en
localhost.

**Esto bloquea:** que las familias entren, que los docentes trabajen desde fuera,
y **el webhook de WhatsApp** (Meta exige HTTPS).

**Necesito de ti:**
- Qué **dominio o subdominio** usar.
- Permiso para tocar `/etc/nginx/sites-available` (**necesita sudo**).
- Confirmar si el certificado va por Let's Encrypt como los otros sitios.

---

## Prioridad 2 — La red de seguridad

### 2.1 Las pruebas del backend están rotas · S · Listo para arrancar

**Hoy: 13 de 23 fallan.** Dos causas, ambas de configuración:

- `auth.service.spec.ts` — se le agregó `MailService` al constructor de
  `AuthService` y nunca se actualizó el módulo de prueba. **Las 12 pruebas de
  login, bloqueo tras 5 intentos fallidos y cambio de contraseña llevan tiempo
  sin ejecutarse.**
- `grades.service.spec.ts` — **ni arranca**: el `moduleNameMapper` de jest apunta
  a `apps/packages/shared` en vez de `packages/shared`.

**Qué hacer:** arreglar las dos configuraciones y agregar pruebas de los bugs que
aparecieron en la revisión, para que no vuelvan.

---

### 2.2 Sin CI y sin pruebas de frontend · M · Listo para arrancar

**Hoy:** no hay `.github/workflows`, y el frontend tiene **cero pruebas**.

Los tres bugs que encontramos —auditoría respondiendo 400 siempre, escala de
valoración imposible de guardar, interceptor que nunca escribió una fila— son
justo lo que un CI atrapa el día que se introducen. Llevaban meses.

**Qué hacer:**
- Workflow que corra `typecheck` + pruebas del backend + `next build` en cada push.
- La regla de oro de este backend documentada como prueba: **una propiedad de DTO
  sin decorador de `class-validator` rompe el endpoint** (el `ValidationPipe` corre
  con `whitelist + forbidNonWhitelisted`). Hay un script de barrido que las detecta.
- Pruebas de humo de las pantallas críticas: notas, asistencia, tesorería.

---

### 2.3 Nadie se entera si se cae · S · Listo para arrancar

**Hoy:** sin endpoint `/health`, sin monitoreo de errores (nada tipo Sentry).
El front estuvo **34 días colgado** sin que nadie lo notara.

**Qué hacer:** `/api/health` que verifique base de datos y disco, y un chequeo
periódico que avise. Sentry si quieres trazas completas — dime si prefieres algo
autoalojado.

---

## Prioridad 3 — Cumplimiento en Colombia

| Qué | Estado | Tamaño |
|---|---|---|
| Habeas data (Ley 1581) | ✅ Resuelto — tablero, consentimientos, política configurable | — |
| Boletín con formato Decreto 1290 | ❌ Ver 1.1 | M |
| **Exportación a SIMAT** | ❌ No existe. Es obligatoria. | M |
| Facturación electrónica DIAN | ❌ No existe. Solo si el colegio factura formalmente. | L |

---

## Prioridad 4 — Producto (cuando lo anterior esté firme)

- **Horario maestro con detección de choques** — hoy se puede asignar un docente
  a dos clases a la misma hora sin que nada avise. · M
- **Carné estudiantil** con código de barras o QR. · S
- **Inasistencias hacia el boletín** — el dato existe, no viaja al informe. · S
- **Multi-sede / multi-colegio** — hoy la configuración institucional es una sola.
  Cambia el modelo de datos, no es un ajuste. · L
- Biblioteca, enfermería, transporte, PAE. · L cada uno
- LMS / aula virtual. · L

---

## Hilos abiertos de esta semana

### Publicar `@s4gk/wa-agent` 1.12.1 · S · **Bloqueado por ti**

edusync ya corre 1.12.1 y funciona, pero **instalado desde un tarball local**
(`file:/home/dev/wa-agent/s4gk-wa-agent-1.12.1.tgz`). GitHub Packages **solo
tiene publicado hasta 1.4.0**; el token de `~/.npmrc` es de solo `read:packages`.

- **Necesito:** un token con `write:packages`.
- ⚠️ El tarball está **gitignorado**, así que otra máquina que clone el proyecto
  no puede instalar hasta que se publique. Es deuda real, no cosmética.
- De paso: el repo de la librería tiene el CHANGELOG parado en 1.9.0 y los tags
  en `v1.9.0`, aunque va en 1.12.1. Faltan las entradas de 1.10.0 a 1.12.1.

### Encender el agente de WhatsApp · **Bloqueado por credenciales**

Construido y verificado (aislamiento entre familias probado). Faltan:
`ANTHROPIC_API_KEY`, `KAPSO_API_KEY`, `KAPSO_PHONE_NUMBER_ID`, `KAPSO_WABA_ID`,
`WHATSAPP_WEBHOOK_VERIFY_TOKEN`, `WHATSAPP_WEBHOOK_APP_SECRET`. Y **HTTPS**, que
depende del punto 1.3.

**Antes de encenderlo, decidir:** la librería ya trae **topes de gasto**
(`BudgetProvider`) y hoy no están cableados. Con 40 acudientes escribiendo, un
bucle sin freno cuesta plata de verdad. Vale la pena ponerle tope por
conversación y por día antes del primer mensaje real.

### El Coach IA · **Bloqueado por credenciales**

Todo el cableado está listo. Solo falta `ANTHROPIC_API_KEY` en `backend/.env` y
un `pm2 restart edusync-backend`.

### Cambios sin commitear

Todo lo de la revisión (20 archivos, ~3.000 líneas) está **desplegado y
funcionando pero sin commitear**, a propósito, para que lo revises antes.

---

## Lo que sí está resuelto

Para no perderlo de vista:

- **Respaldos diarios** de base + uploads, retención 14 días. El último corrió
  hoy a las 05:34.
- **`pm2-dev.service` habilitado** — lo que faltaba de `sudo pm2 startup` ya está.
  Convendría probarlo con un reinicio real.
- Backend escuchando **solo en loopback**; Swagger ya no queda expuesto.
- **Rate limiting** de 300/min por usuario.
- **Trazabilidad funcionando** — antes la tabla estaba vacía y nadie lo sabía.
- **Tesorería operativa**, configuración institucional editable, escala de
  valoración configurable, promoción entre años.

---

## Mi propuesta de arranque

Si me dices "dale" sin más, hago en este orden:

1. **2.1** — arreglar las pruebas (es corto y destapa lo que esté roto).
2. **1.1** — PDF del boletín.
3. **1.2** — cerrar el ciclo de matrícula.
4. **2.2 y 2.3** — CI y monitoreo.

**1.3 (HTTPS)** lo dejo para cuando me pases dominio y sudo, porque desbloquea
WhatsApp y el acceso de las familias — si te sirve, ese sería el primero.
