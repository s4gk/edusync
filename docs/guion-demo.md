# Guion de demostración — EduSync

Presentación **en persona**, desde tu equipo, contra el servidor.
Duración objetivo: **20 minutos** de recorrido + preguntas.

---

## Antes de entrar a la sala

1. **Comprueba que está arriba** (30 segundos):
   ```bash
   pm2 list | grep edusync          # edusync y edusync-backend en "online"
   curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3003/login   # 200
   ```
2. Abre el navegador **en ventana de incógnito** y con **zoom al 100 %**. Incógnito
   evita que aparezca una sesión vieja a mitad de la demo.
3. Ten las tres pestañas ya abiertas y con sesión iniciada:
   rector, docente y acudiente (ver cuentas abajo). Cambiar de rol delante del
   público quema dos minutos cada vez.
4. **No proyectes la terminal** mientras haya archivos `.env` abiertos.

### Cuentas

| Rol | Correo | Contraseña |
|---|---|---|
| Rector | `rector@school.edu.co` | `Admin1234!` |
| Docente | `profesor@school.edu.co` | `Admin1234!` |
| Acudiente | `marta.avila29@familia.edu.co` | pídela con "Restablecer contraseña" desde la ficha |

> Entra como **Rector**, no como Super Admin: el Super Admin saluda "Buenas tardes, Super"
> y no tiene nombre de persona. El rector se llama Carlos Rectorado.

---

## Acto 1 — El rector (8 min)

**Idea que tiene que quedar: el colegio se ve completo en una pantalla.**

1. **Inicio.** 30 estudiantes, 10 docentes, 30 matrículas, $35 M facturados del mes,
   6 pagos vencidos. Pasa a la pestaña **Finanzas**: facturado contra recaudado, mes
   a mes. → *"Esto no es un informe que alguien arma el viernes; es lo que hay ahora."*
2. **Pendientes.** Lo que falta hoy: periodos abiertos, notas sin registrar,
   estudiantes en riesgo. Botón de **alertas automáticas** → le llega la novedad al
   acudiente. (Ya se corrió una vez; si lo pulsas otra vez dirá que no hay nuevas —
   el sistema no repite alertas antes de 24 h, dilo, suma.)
3. **Estudiantes** → entra a una ficha. Datos, foto, notas, observaciones, saldo,
   acudiente. → *"Todo lo de un estudiante en un solo lugar."*
4. **Cierre de periodo** y **Cierre de año**: el acta de promoción con promedio,
   áreas perdidas y estado (promovido / recuperación / reprobado).
5. **Certificados.** Genera en vivo una constancia de estudio en PDF. Tarda unos
   segundos: aprovecha para contar que sale con los datos del colegio.
6. **Protección de datos.** Aquí se separa de la competencia:
   → *"La Ley 1581 no pide haber pedido permiso; pide poder probarlo."*
   Muestra cuántas familias tienen autorización vigente y a quiénes falta, y abre el
   historial de una: quién firmó, en qué calidad, cuándo, por qué canal y sobre qué
   versión del texto. Se revoca, no se borra.

## Acto 2 — El docente (5 min)

**Idea: al profesor le quita trabajo, no se lo agrega.**

1. **Mi clase.** Aterriza en su clase con la lista lista para llamar. Marca un par de
   ausentes y guarda. → *"Dos toques y quedó."*
2. Toca el **nombre de un estudiante** → ficha rápida con su promedio, el contacto del
   acudiente y el observador para anotar ahí mismo.
3. **Calificaciones.** Muestra el pegado desde Excel (`Ctrl+V` sobre una columna) y el
   autoguardado. Crea un logro y una evaluación. → *"Esto es lo que hoy hacen en un
   cuaderno o en un Excel que solo ellos entienden."*
4. **En riesgo.** Sus estudiantes con nota baja o inasistencia, sin buscarlos a mano.

## Acto 3 — La familia (5 min)

**Idea: el colegio deja de ser una caja negra para el papá.**

Abre `/app-acudiente` (ideal desde el celular, o achica la ventana del navegador para
que se vea como app).

1. **Hoy.** Saludo, el hijo, promedio, estado de pensión y la novedad que generó el
   rector en el Acto 1. → *"La alerta que él creó hace cinco minutos ya está aquí."*
2. **Notas.** Materias con su promedio, peor primero.
3. **Pagos.** Estado de cuenta: qué debe, qué ya pagó y con cuánta mora.
4. **Mensajes.** Toca la novedad para marcarla leída.

Cierra con `/recap` o `/trayectoria` en pantalla completa: el informe del periodo
contado como una historia, no como una tabla.

---

## Lo que hoy NO hay que abrir

| Pantalla | Por qué | Qué decir si preguntan |
|---|---|---|
| **Coach IA** (`/coach`) | Falta la llave de Anthropic; responde error | "Está construido; se enciende con una llave de API." |
| **Asistente WhatsApp** (`/chatbot`) | Sin credenciales de Kapso y necesita HTTPS público | "Los cuatro agentes están hechos y probados; falta conectar la línea." |
| **Correo real** | Sin SMTP; el enlace de recuperar contraseña sale en el log | "Funciona el flujo completo; falta el buzón de salida del colegio." |
| **Drive** | Está vacío en la demo | Súbele un archivo antes si lo vas a mostrar. |

---

## Preguntas que van a hacer

**"¿Y si se cae el servidor / se pierde todo?"**
Copia de seguridad diaria a las 2:30 a. m. de la base **y de los archivos**, con una
restauración de prueba automática cada sábado. No es "hacemos backups": es que se
verifica que sirvan.

**"¿Quién puede ver qué?"**
Permisos por rol comprobados en el servidor, no en la pantalla. Un acudiente solo ve a
sus hijos, y eso está bloqueado en el código, no confiando en lo que pida el navegador.
Un docente no puede ver el expediente de otro curso.

**"¿Y los datos de los menores?"**
Autorización de tratamiento como paso obligatorio de la matrícula, con evidencia de
quién firmó y sobre qué texto, tablero de cumplimiento y revocación. Falta que el
colegio registre la base ante el **RNBD** de la Superintendencia: es un trámite suyo.

**"¿Cuánto se demora montarlo con nuestros datos?"**
Hay importador por CSV para estudiantes. Lo que toma tiempo no es el sistema, es que el
colegio consiga sus listas limpias.

**"¿Sirve en el celular?"**
La vista de la familia sí, es la que usan los papás. La consola administrativa está
pensada para computador.

---

## Plan B

- **Se cae el front** → `pm2 restart edusync`, 5 segundos.
- **Se cae el backend** → `pm2 restart edusync-backend`, 6 segundos. Las pantallas
  quedan vacías, no rotas.
- **Se cayó internet de la sala** → no importa: todo corre en el servidor local.
- **Algo se ve raro** → sigue, no lo depures en vivo; anótalo y sigue el guion.

---

## Después de la reunión

Si dicen que sí, el orden es: datos reales del colegio en el `.env`
(nombre, NIT, dirección, correo de habeas data) → importar sus estudiantes y docentes →
credenciales de correo → dominio y HTTPS → WhatsApp.
