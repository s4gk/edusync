"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle, Bot, CheckCircle2, Circle, Loader2, MessageSquare,
  Power, RefreshCw, ShieldCheck, TriangleAlert,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth-context";

interface Config {
  encendido: boolean;
  piloto: boolean;
  allowlist: string[];
  topeDiario: number;
  montado: boolean;
  canalListo: boolean;
  usoHoy: { mensajes: number; tokensEntrada: number; tokensSalida: number };
}

interface Mensaje {
  id: string;
  phone: string;
  direction: string;
  body: string;
  createdAt: string;
}

export default function ChatbotPage() {
  const { user } = useAuth();
  const [cfg, setCfg] = useState<Config | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allowlist, setAllowlist] = useState("");
  const [tope, setTope] = useState("300");
  const [prueba, setPrueba] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const c = await api<Config>("/chatbot/config");
      setCfg(c);
      setAllowlist(c.allowlist.join(", "));
      setTope(String(c.topeDiario));
      const m = await api<{ data: Mensaje[] }>("/chatbot/conversaciones?limit=30");
      setMensajes(m.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar la configuración.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  async function guardar(cambios: Record<string, string>) {
    setGuardando(true);
    setError(null);
    try {
      await api("/chatbot/config", { method: "PUT", body: cambios });
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  }

  async function probar() {
    setPrueba("…");
    try {
      const r = await api<{ ok: boolean; error?: string; phone?: string; name?: string }>(
        "/chatbot/probar", { method: "POST" },
      );
      setPrueba(r.ok ? `Conectado: ${r.name ?? "?"} (${r.phone ?? "?"})` : `No conecta: ${r.error}`);
    } catch (e) {
      setPrueba(e instanceof Error ? e.message : "Error al probar.");
    }
  }

  if (user && user.role !== "SUPER_ADMIN" && user.role !== "RECTOR") {
    return (
      <div className="p-8">
        <p className="text-sm text-subtle">Esta sección es solo para rectoría.</p>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-subtle" />
      </div>
    );
  }

  // Tres condiciones distintas que la gente confunde: tener modelo, tener canal
  // y haberlo encendido. Se muestran por separado porque el diagnóstico de "no
  // responde" es distinto en cada caso.
  const responde = Boolean(cfg?.montado && cfg?.canalListo && cfg?.encendido);

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <header className="flex flex-col gap-2">
        <p className="text-[11px] font-bold tracking-[0.18em] text-subtle">OPERACIÓN</p>
        <h1 className="flex items-center gap-2.5 text-2xl font-bold text-ink">
          <Bot className="h-6 w-6" />
          Asistente de WhatsApp
        </h1>
        <p className="text-sm text-subtle">
          Responde por WhatsApp a acudientes, docentes y directivos según quién escriba. Solo consulta
          información: no modifica nada del sistema.
        </p>
      </header>

      {error && (
        <div className="flex items-center gap-2 rounded-[10px] bg-s-error px-4 py-3 text-[13px] font-medium text-s-error-fg">
          <TriangleAlert className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Estado */}
      <section className="rounded-xl border border-line bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-full ${
                responde ? "bg-s-success" : "bg-surface"
              }`}
            >
              <Power className={`h-5 w-5 ${responde ? "text-s-success-fg" : "text-subtle"}`} />
            </span>
            <div>
              <p className="text-base font-semibold text-ink">
                {responde ? "El asistente está respondiendo" : "El asistente no está respondiendo"}
              </p>
              <p className="text-[13px] text-subtle">
                {cfg?.encendido && cfg?.piloto
                  ? `Encendido en modo piloto: solo ${cfg.allowlist.length} número(s).`
                  : cfg?.encendido
                    ? "Encendido para todos los que escriban."
                    : "Apagado. Los mensajes se registran igual para que los atienda una persona."}
              </p>
            </div>
          </div>

          <button
            onClick={() => guardar({ encendido: cfg?.encendido ? "false" : "true" })}
            disabled={guardando || !cfg?.montado || !cfg?.canalListo}
            className={`flex h-11 items-center gap-2 rounded-[10px] px-5 text-sm font-bold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${
              cfg?.encendido ? "border border-line text-ink" : "bg-primary text-white"
            }`}
          >
            {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
            {cfg?.encendido ? "Apagar" : "Encender"}
          </button>
        </div>

        <div className="mt-5 grid gap-3 border-t border-line pt-5 sm:grid-cols-3">
          <Requisito
            ok={Boolean(cfg?.montado)}
            titulo="Modelo de IA"
            detalle={cfg?.montado ? "Configurado" : "Falta ANTHROPIC_API_KEY en el backend"}
          />
          <Requisito
            ok={Boolean(cfg?.canalListo)}
            titulo="Canal de WhatsApp"
            detalle={cfg?.canalListo ? "Credenciales presentes" : "Faltan las credenciales de Kapso"}
          />
          <Requisito
            ok={Boolean(cfg?.encendido)}
            titulo="Encendido por el colegio"
            detalle={cfg?.encendido ? "Sí" : "Decisión pendiente"}
          />
        </div>

        {cfg?.canalListo && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={probar}
              className="flex h-9 items-center gap-2 rounded-[8px] border border-line px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Probar conexión
            </button>
            {prueba && <span className="text-[13px] text-subtle">{prueba}</span>}
          </div>
        )}
      </section>

      {/* Piloto y tope */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-card p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
            <ShieldCheck className="h-4 w-4" /> Modo piloto
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-subtle">
            Mientras haya números en esta lista, el asistente <strong>solo</strong> responde a ellos. Es la
            forma segura de estrenar: se prueba con dos o tres familias antes de abrirlo al colegio entero.
            Vacío = responde a todos.
          </p>
          <textarea
            value={allowlist}
            onChange={(e) => setAllowlist(e.target.value)}
            rows={3}
            placeholder="+573001112233, +573004445566"
            className="mt-3 w-full rounded-[10px] border border-line bg-transparent px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-primary placeholder:text-line"
          />
          <button
            onClick={() => guardar({ allowlist })}
            disabled={guardando}
            className="mt-3 flex h-9 items-center gap-2 rounded-[8px] bg-primary px-4 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            Guardar lista
          </button>
        </div>

        <div className="rounded-xl border border-line bg-card p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
            <AlertTriangle className="h-4 w-4" /> Tope de mensajes por día
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-subtle">
            Al llegar al tope, el asistente deja de responder por ese día y avisa a quien escriba que lo
            atenderá una persona. Es el freno de mano contra un bucle que gaste la cuenta en una noche.
          </p>
          <input
            type="number"
            min={1}
            value={tope}
            onChange={(e) => setTope(e.target.value)}
            className="mt-3 h-11 w-40 rounded-[10px] border border-line bg-transparent px-3.5 text-sm font-semibold text-ink outline-none transition-colors focus:border-primary"
          />
          <p className="mt-2 text-[13px] text-subtle">
            Hoy van <strong className="text-ink">{cfg?.usoHoy.mensajes ?? 0}</strong> mensaje(s).
          </p>
          <button
            onClick={() => guardar({ topeDiario: tope })}
            disabled={guardando}
            className="mt-3 flex h-9 items-center gap-2 rounded-[8px] bg-primary px-4 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            Guardar tope
          </button>
        </div>
      </section>

      {/* Conversaciones */}
      <section className="rounded-xl border border-line bg-card p-5">
        <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
          <MessageSquare className="h-4 w-4" /> Últimos mensajes
        </h2>
        {mensajes.length === 0 ? (
          <p className="mt-3 text-[13px] text-subtle">Todavía no ha entrado ningún mensaje por WhatsApp.</p>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-line">
            {mensajes.map((m) => (
              <li key={m.id} className="flex items-start gap-3 py-2.5">
                <span
                  className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    m.direction === "in" ? "bg-surface text-subtle" : "bg-s-success text-s-success-fg"
                  }`}
                >
                  {m.direction === "in" ? "ENTRA" : "SALE"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-ink">{m.body}</p>
                  <p className="text-[11px] text-subtle">
                    {m.phone} · {new Date(m.createdAt).toLocaleString("es-CO")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Requisito({ ok, titulo, detalle }: { ok: boolean; titulo: string; detalle: string }) {
  return (
    <div className="flex items-start gap-2.5">
      {ok ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
      ) : (
        <Circle className="mt-0.5 h-4 w-4 shrink-0 text-line" />
      )}
      <div>
        <p className="text-[13px] font-semibold text-ink">{titulo}</p>
        <p className="text-[12px] text-subtle">{detalle}</p>
      </div>
    </div>
  );
}
