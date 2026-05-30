import {
  ArrowLeft,
  Languages,
  Volume2,
  Download,
  Share2,
  Sparkles,
  Crown,
  Heart,
  Trophy,
  ArrowUpRight,
} from "lucide-react";

/* paleta oscura inmersiva (el diseño es dark en ambos temas) */

const RING_SIZE = 200;
const C = RING_SIZE / 2;

function Ring({ pct, track, color }: { pct: number; track: string; color: string }) {
  const r = 82;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} className="shrink-0">
      <g transform={`rotate(-90 ${C} ${C})`}>
        <circle cx={C} cy={C} r={r} fill="none" stroke={track} strokeWidth={28} />
        <circle cx={C} cy={C} r={r} fill="none" stroke={color} strokeWidth={28} strokeLinecap="round" strokeDasharray={`${(pct / 100) * circ} ${circ}`} />
      </g>
    </svg>
  );
}

const SUBJECTS = [
  { name: "Ciencias Sociales", grade: "4.9", tone: "text-emerald-300", bar: "bg-emerald-400", pct: 98 },
  { name: "Educación Física", grade: "4.9", tone: "text-emerald-300", bar: "bg-emerald-400", pct: 98 },
  { name: "Ciencias Naturales", grade: "4.7", tone: "text-emerald-300", bar: "bg-emerald-400", pct: 94 },
  { name: "Educación Artística", grade: "4.4", tone: "text-sky-300", bar: "bg-sky-400", pct: 88 },
  { name: "Matemáticas", grade: "4.3", tone: "text-sky-300", bar: "bg-sky-400", pct: 86 },
  { name: "Lengua Castellana", grade: "4.2", tone: "text-sky-300", bar: "bg-sky-400", pct: 84 },
  { name: "Inglés", grade: "4.0", tone: "text-amber-300", bar: "bg-amber-400", pct: 80 },
  { name: "Tecnología e Informática", grade: "3.0", tone: "text-rose-300", bar: "bg-rose-400", pct: 60 },
];

const MOMENTS = [
  { icon: Crown, title: "Lideraste el debate de procesos de paz", sub: "Ciencias Sociales · 12 abr" },
  { icon: Trophy, title: "Reconocimiento por liderazgo de grupo", sub: "Dirección de grupo · 28 abr" },
  { icon: Heart, title: "Cero observaciones disciplinarias", sub: "Todo el periodo" },
];

export default function RecapPage() {
  return (
    <div className="min-h-screen bg-[#131124] text-[#E8E8EA]">
      {/* ====== utility bar ====== */}
      <header className="flex items-center justify-between border-b border-[#2B283D] px-6 py-3">
        <div className="flex items-center gap-3.5">
          <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2B283D] text-[#E8E8EA]">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="hidden text-xs text-[#888799] sm:block">Volver al panel</span>
          <span className="hidden h-6 w-px bg-[#2B283D] sm:block" />
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-[13px] font-extrabold text-white">E</span>
          <span className="hidden text-xs font-semibold tracking-wide text-[#888799] sm:block">EDUSYNC · Colegio San Mateo</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1 rounded-[10px] bg-[#131124] p-1 sm:flex">
            {["Vista rector", "Vista familia", "PDF"].map((o, i) => (
              <span key={o} className={`rounded-lg px-2 py-1.5 text-[11px] ${i === 1 ? "border border-[#2B283D] bg-[#1A182E] font-bold text-[#E8E8EA]" : "font-medium text-[#888799]"}`}>{o}</span>
            ))}
          </div>
          <button className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#2B283D]"><Languages className="h-3.5 w-3.5" /></button>
          <button className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#2B283D]"><Volume2 className="h-3.5 w-3.5" /></button>
          <button className="hidden h-8 items-center gap-1.5 rounded-lg border border-[#2B283D] px-2.5 text-xs font-semibold sm:flex"><Download className="h-3.5 w-3.5" /> Descargar</button>
          <button className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-white"><Share2 className="h-3.5 w-3.5" /> Compartir con familia</button>
        </div>
      </header>

      {/* ====== hero ====== */}
      <section
        className="relative overflow-hidden px-6 py-12 sm:px-12"
        style={{ background: "linear-gradient(135deg, #1A0E5C 0%, #5749F4 45%, #FF7BD5 100%)" }}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2.5 text-[10px] font-bold tracking-[0.3em] text-white/70">
            <span className="h-2 w-2 rounded-full bg-white" /> EDUSYNC · BOLETÍN INTERACTIVO
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-[10px] font-bold tracking-[0.16em] text-white">
            <Sparkles className="h-3 w-3" /> EDICIÓN ESPECIAL · PERIODO 2
          </span>
        </div>
        <div className="flex flex-col items-start justify-between gap-8 pt-10 lg:flex-row lg:items-center">
          <div className="flex flex-col gap-4">
            <span className="text-base font-bold tracking-[0.4em] text-white/70 sm:text-lg">EL PERIODO DE</span>
            <span className="text-[22vw] font-black leading-[0.9] -tracking-[0.05em] text-white lg:text-[180px]">CAMILA</span>
            <div className="flex items-center gap-4">
              <span className="h-16 w-1 rounded bg-white" />
              <p className="max-w-xl text-lg font-semibold leading-snug -tracking-[0.01em] text-white sm:text-[22px]">
                Esto fue lo que pasó del 17 de marzo al 23 de mayo de 2025. 35 estudiantes, 8 materias, 1 historia.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-center gap-5">
            <span className="flex h-44 w-44 items-center justify-center rounded-full border-[6px] border-white/40 bg-white sm:h-48 sm:w-48">
              <span className="flex h-36 w-36 items-center justify-center rounded-full bg-primary text-6xl font-black text-white sm:h-40 sm:w-40">CR</span>
            </span>
            <span className="text-lg font-bold text-white">Camila Restrepo Henao</span>
            <span className="rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-[11px] font-semibold text-white">
              Grado 8°B · 13 años · ID-2025-014
            </span>
          </div>
        </div>
      </section>

      {/* ====== capítulo 1: cómo te fue ====== */}
      <section className="flex flex-col gap-6 px-6 py-12 sm:px-12">
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-primary">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[12px] font-extrabold text-white">01</span>
            CAPÍTULO 1 · CÓMO TE FUE
          </span>
          <h2 className="max-w-3xl text-4xl font-extrabold leading-[1.05] -tracking-[0.03em] sm:text-5xl">Cerraste el periodo con todas las luces verdes.</h2>
          <p className="max-w-2xl text-base text-[#888799]">Estos son los tres anillos que mide tu colegio cada periodo. Cierra los tres y la familia respira.</p>
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Promedio */}
          <div className="flex items-center gap-6 rounded-3xl border border-[#2B283D] bg-[#1A182E] p-7">
            <div className="relative shrink-0">
              <Ring pct={86} track="#3B4748" color="#A1E5A1" />
              <span className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-extrabold -tracking-[0.03em] text-[#E8E8EA]">4.3</span>
                <span className="text-xs text-[#888799]">/ 5.0</span>
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold tracking-[0.18em] text-[#888799]">PROMEDIO GENERAL</span>
              <span className="text-2xl font-bold -tracking-[0.01em]">Subiste +0,4 puntos</span>
              <span className="text-[13px] leading-relaxed text-[#888799]">Cerraste por encima del promedio del grupo (3.9) y subiste 8 posiciones desde el Periodo 1.</span>
            </div>
          </div>
          {/* Asistencia */}
          <div className="flex items-center gap-6 rounded-3xl border border-[#2B283D] bg-[#1A182E] p-7">
            <div className="relative shrink-0">
              <Ring pct={96} track="#404562" color="#B2CCFF" />
              <span className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold -tracking-[0.03em] text-[#E8E8EA]">96,4%</span>
                <span className="text-xs text-[#888799]">47 / 49 días</span>
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold tracking-[0.18em] text-[#888799]">ASISTENCIA</span>
              <span className="text-2xl font-bold -tracking-[0.01em]">Solo faltaste 2 días.</span>
              <span className="text-[13px] leading-relaxed text-[#888799]">Una incapacidad médica y un permiso por viaje familiar. Llegada puntual 96% de los días.</span>
            </div>
          </div>
          {/* Convivencia */}
          <div className="flex items-center gap-6 rounded-3xl border border-[#2B283D] bg-[#1A182E] p-7">
            <div className="relative shrink-0">
              <Ring pct={100} track="#131124" color="#5749F4" />
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                <Heart className="h-12 w-12 text-primary" fill="#5749F4" />
                <span className="text-[10px] font-bold tracking-[0.18em] text-[#E8E8EA]">EXCELENTE</span>
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold tracking-[0.18em] text-[#888799]">CONVIVENCIA</span>
              <span className="text-lg font-bold -tracking-[0.01em]">0 observaciones · 2 reconocimientos</span>
              <span className="text-[13px] leading-relaxed text-[#888799]">Mantuviste tu compromiso con el grupo y recibiste reconocimiento por liderazgo en Ciencias Sociales.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ====== capítulo 2: tu materia del periodo ====== */}
      <section className="flex flex-col gap-6 px-6 py-8 sm:px-12">
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-2.5 text-xs font-bold tracking-[0.16em] text-[#FFD9B2]">
            <span className="flex items-center justify-center rounded-md bg-[#FFD9B2] px-2 py-1 text-[11px] font-extrabold text-[#4D2700]">02</span>
            CAPÍTULO 2 · TU MATERIA DEL PERIODO
          </span>
          <h2 className="max-w-3xl text-4xl font-extrabold leading-[1.05] -tracking-[0.03em] sm:text-5xl">Brillaste en Ciencias Sociales.</h2>
          <p className="max-w-2xl text-base text-[#888799]">Una de cada cinco notas de Ciencias Sociales fue 5,0 y lideraste el debate del trimestre.</p>
        </div>
        <div className="flex flex-col overflow-hidden rounded-[28px] border border-[#2B283D] lg:flex-row">
          {/* visual */}
          <div
            className="flex flex-1 flex-col justify-between gap-8 p-9 text-white"
            style={{ background: "linear-gradient(200deg, #FF7BD5 0%, #FF8400 50%, #FFC85C 100%)" }}
          >
            <div className="flex items-start justify-between">
              <span className="flex items-center gap-1.5 rounded-full border border-white/30 bg-white/20 px-3 py-1.5 text-[10px] font-bold tracking-[0.16em]">
                <Crown className="h-3 w-3" /> MEJOR MATERIA DEL PERIODO
              </span>
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-[10px] font-extrabold tracking-wide text-[#FF8400]">N5</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-extrabold tracking-[0.2em] text-white/80">CIENCIAS</span>
              <span className="text-[16vw] font-black leading-[0.9] -tracking-[0.04em] lg:text-[110px]">SOCIALES.</span>
            </div>
            <div className="flex items-end justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold tracking-[0.16em] text-white/80">CON LA PROFE</span>
                <span className="text-sm font-semibold">Ana María Lozano</span>
              </div>
              <div className="flex items-end">
                <span className="text-7xl font-black leading-none -tracking-[0.03em]">4.9</span>
                <span className="pb-2 text-sm font-bold text-white/80">/ 5.0</span>
              </div>
            </div>
          </div>
          {/* content */}
          <div className="flex flex-col justify-between gap-5 bg-[#1A182E] p-9 lg:w-[520px]">
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold tracking-[0.18em] text-[#888799]">POR QUÉ DESTACASTE</span>
              <span className="text-5xl font-black leading-none text-[#F2F3F0]">“</span>
              <p className="text-[22px] font-semibold leading-snug -tracking-[0.01em]">
                Camila lideró el debate sobre los procesos de paz en Colombia con una claridad excepcional para su edad.
              </p>
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFD9B2] text-[11px] font-bold text-[#4D2700]">AL</span>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold">Ana María Lozano</span>
                  <span className="text-[11px] text-[#888799]">Docente de Ciencias Sociales</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { l: "NOTAS DEL PERIODO", v: "12", d: "Todas registradas", dc: "text-[#888799]" },
                { l: "PROMEDIO PERSONAL", v: "4.9", d: "+0.3 vs P1", dc: "text-emerald-300" },
                { l: "POSICIÓN EN MATERIA", v: "1 / 35", d: "Top del salón", dc: "text-[#888799]" },
              ].map((s) => (
                <div key={s.l} className="flex flex-col gap-1 rounded-xl bg-[#131124] p-3.5">
                  <span className="text-[10px] font-bold tracking-wide text-[#888799]">{s.l}</span>
                  <span className="text-[22px] font-extrabold text-[#E8E8EA]">{s.v}</span>
                  <span className={`text-[10px] font-medium ${s.dc}`}>{s.d}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-[#2B283D] pt-4">
              <span className="flex items-center gap-1.5 text-[11px] text-[#888799]"><Sparkles className="h-3 w-3 text-primary" /> Generado con Edusync AI</span>
              <button className="flex items-center gap-1.5 rounded-lg border border-[#2B283D] px-3 py-2 text-xs font-semibold"><Share2 className="h-3 w-3" /> Compartir este momento</button>
            </div>
          </div>
        </div>
      </section>

      {/* ====== capítulo 3: tus 8 materias ====== */}
      <section className="flex flex-col gap-6 px-6 py-12 sm:px-12">
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-2.5 text-xs font-bold tracking-[0.16em] text-sky-300">
            <span className="flex items-center justify-center rounded-md bg-sky-300 px-2 py-1 text-[11px] font-extrabold text-[#001133]">03</span>
            CAPÍTULO 3 · TUS 8 MATERIAS
          </span>
          <h2 className="max-w-3xl text-4xl font-extrabold leading-[1.05] -tracking-[0.03em] sm:text-5xl">Cómo te fue en cada una.</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SUBJECTS.map((s) => (
            <div key={s.name} className="flex flex-col gap-3 rounded-2xl border border-[#2B283D] bg-[#1A182E] p-5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold leading-tight">{s.name}</span>
                <span className={`text-2xl font-extrabold ${s.tone}`}>{s.grade}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#131124]">
                <span className={`block h-full rounded-full ${s.bar}`} style={{ width: `${s.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ====== capítulo 4: reconocimientos + a mejorar ====== */}
      <section className="flex flex-col gap-6 px-6 py-8 sm:px-12">
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-2.5 text-xs font-bold tracking-[0.16em] text-emerald-300">
            <span className="flex items-center justify-center rounded-md bg-emerald-300 px-2 py-1 text-[11px] font-extrabold text-[#003300]">04</span>
            CAPÍTULO 4 · RECONOCIMIENTOS
          </span>
          <h2 className="max-w-3xl text-4xl font-extrabold leading-[1.05] -tracking-[0.03em] sm:text-5xl">Momentos que vale la pena recordar.</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {MOMENTS.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.title} className="flex items-start gap-3.5 rounded-2xl border border-[#2B283D] bg-[#1A182E] p-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary"><Icon className="h-5 w-5" /></span>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold">{m.title}</span>
                  <span className="text-xs text-[#888799]">{m.sub}</span>
                </div>
              </div>
            );
          })}
        </div>
        {/* a mejorar */}
        <div
          className="flex flex-col justify-between gap-6 overflow-hidden rounded-[28px] p-9 text-white lg:flex-row lg:items-end"
          style={{ background: "linear-gradient(135deg, #5749F4 0%, #2D2380 100%)" }}
        >
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-bold tracking-[0.18em] text-white/70">UN RETO PARA EL PERIODO 3</span>
            <span className="text-2xl font-extrabold tracking-[0.16em] text-white/80">TECNOLOGÍA</span>
            <span className="text-[12vw] font-black leading-[0.9] -tracking-[0.04em] lg:text-[88px]">E INFORMÁTICA</span>
            <p className="max-w-xl text-sm leading-relaxed text-white/80">
              Cerraste en 3.0 — tu materia más retadora. Con dos entregas pendientes al día, esto sube rápido. Tu profe ya tiene un plan.
            </p>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-7xl font-black leading-none">3.0</span>
            <button className="mb-2 flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[13px] font-semibold text-primary">
              Ver plan de mejora <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ====== capítulo 5 + footer ====== */}
      <section className="flex flex-col items-center gap-6 px-6 py-16 text-center sm:px-12">
        <span className="text-xs font-bold tracking-[0.16em] text-[#888799]">CAPÍTULO 5 · CIERRE</span>
        <h2 className="max-w-4xl text-5xl font-black leading-[1.05] -tracking-[0.03em] sm:text-7xl">Y eso fue tu Periodo 2.</h2>
        <p className="max-w-2xl text-lg text-[#888799]">
          Un periodo de luces verdes. Gracias por el esfuerzo, Camila — y gracias a la familia por acompañar el camino.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white"><Share2 className="h-4 w-4" /> Compartir con la familia</button>
          <button className="flex items-center gap-2 rounded-full border border-[#2B283D] px-6 py-3 text-sm font-semibold"><Download className="h-4 w-4" /> Descargar PDF</button>
        </div>
        <div className="mt-8 flex items-center gap-2 border-t border-[#2B283D] pt-8 text-xs text-[#888799]">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-primary text-[10px] font-extrabold text-white">E</span>
          EDUSYNC · Colegio San Mateo · Boletín interactivo generado con Edusync AI
        </div>
      </section>
    </div>
  );
}
