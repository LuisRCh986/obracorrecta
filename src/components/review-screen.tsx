"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ReviewDashboard } from "@/components/review-dashboard";
import {
  analysisEventSchema,
  projectResponseSchema,
  scenarioSchema,
  type Scenario,
} from "@/lib/review-contracts";
import type { Finding, Project } from "@/types/review";

type ProjectState =
  | { status: "loading" }
  | { status: "ready"; project: Project }
  | { status: "error"; message: string };

type AnalysisState = {
  findings: Finding[];
  total: number | null;
} & (
  | { status: "idle" | "running" | "completed" | "cancelled" }
  | { status: "error"; message: string }
);

const initialAnalysis: AnalysisState = {
  status: "idle",
  findings: [],
  total: null,
};

const buttonClass =
  "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";

export function ReviewScreen() {
  const [projectState, setProjectState] = useState<ProjectState>({
    status: "loading",
  });

  const [loadAttempt, setLoadAttempt] = useState(0);
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [scenario, setScenario] = useState<Scenario>("success");

  // La conexión es un recurso, no un dato que debamos renderizar.
  const stopRef = useRef<(() => void) | null>(null);

  const stopStream = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProject() {
      try {
        const response = await fetch("/api/projects/demo", {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            `No se pudo cargar el proyecto. HTTP ${response.status}.`,
          );
        }

        const raw: unknown = await response.json();
        const parsed = projectResponseSchema.safeParse(raw);

        if (!parsed.success) {
          throw new Error("La API devolvió un proyecto inválido.");
        }

        if (!controller.signal.aborted) {
          setProjectState({
            status: "ready",
            project: parsed.data.project,
          });
        }
      } catch (error) {
        if (controller.signal.aborted) return;

        setProjectState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "No se pudo cargar el proyecto.",
        });
      }
    }

    void loadProject();

    return () => controller.abort();
  }, [loadAttempt]);

  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  function retryProject() {
    setProjectState({ status: "loading" });
    setLoadAttempt((previous) => previous + 1);
  }

  function startAnalysis() {
    if (projectState.status !== "ready") return;

    stopStream();

    setAnalysis({
      status: "running",
      findings: [],
      total: null,
    });

    const source = new EventSource(
      `/api/projects/demo/analysis?scenario=${scenario}`,
    );

    let active = true;
    let total: number | null = null;
    const received: Finding[] = [];
    let timeout: ReturnType<typeof setTimeout> | undefined;

    stopRef.current = () => {
      active = false;
      clearTimeout(timeout);
      source.close();
    };

    function fail(message: string) {
      if (!active) return;

      stopStream();

      setAnalysis({
        status: "error",
        findings: [...received],
        total,
        message,
      });
    }

    function resetTimeout() {
      clearTimeout(timeout);

      timeout = setTimeout(() => {
        fail("El servidor dejó de enviar actualizaciones. Puedes reintentar.");
      }, 15000);
    }

    resetTimeout();

    source.addEventListener("analysis", (message: MessageEvent<string>) => {
      if (!active) return;

      try {
        const raw: unknown = JSON.parse(message.data);
        const parsed = analysisEventSchema.safeParse(raw);

        if (!parsed.success) {
          fail("El servidor envió un evento con formato inválido.");
          return;
        }

        resetTimeout();
        const event = parsed.data;

        switch (event.type) {
          case "started": {
            if (total !== null) {
              fail("Se recibió un inicio de análisis duplicado.");
              return;
            }

            total = event.total;

            setAnalysis({
              status: "running",
              findings: [],
              total,
            });
            break;
          }

          case "finding": {
            const duplicated = received.some(
              (finding) => finding.id === event.finding.id,
            );

            if (total === null || received.length >= total || duplicated) {
              fail("Se recibió un hallazgo fuera del contrato del análisis.");
              return;
            }

            received.push(event.finding);

            setAnalysis({
              status: "running",
              findings: [...received],
              total,
            });
            break;
          }

          case "completed": {
            if (
              total === null ||
              event.total !== total ||
              received.length !== total
            ) {
              fail("El análisis terminó con resultados incompletos.");
              return;
            }

            stopStream();

            setAnalysis({
              status: "completed",
              findings: [...received],
              total,
            });
            break;
          }

          case "failed":
            fail(event.message);
            break;
        }
      } catch {
        fail("No se pudo interpretar el mensaje del servidor.");
      }
    });

    source.onerror = () => {
      fail("Se perdió la conexión con el análisis. Puedes reintentar.");
    };
  }

  function cancelAnalysis() {
    stopStream();

    setAnalysis((previous) => ({
      status: "cancelled",
      findings: previous.findings,
      total: previous.total,
    }));
  }

  if (projectState.status === "loading") {
    return (
      <main className="mx-auto max-w-6xl p-6">
        <p role="status">Cargando proyecto…</p>
      </main>
    );
  }

  if (projectState.status === "error") {
    return (
      <main className="mx-auto max-w-6xl space-y-4 p-6">
        <p role="alert" className="text-red-700">
          {projectState.message}
        </p>

        <button type="button" onClick={retryProject} className={buttonClass}>
          Reintentar carga
        </button>
      </main>
    );
  }

  const running = analysis.status === "running";

  const statusText =
    analysis.status === "idle"
      ? "Listo para iniciar el análisis."
      : analysis.status === "running"
        ? "Recibiendo resultados. Puedes consultar sus fuentes mientras llegan."
        : analysis.status === "completed"
          ? "Análisis completado."
          : analysis.status === "cancelled"
            ? "Análisis cancelado. Se conservaron los resultados parciales."
            : "Análisis interrumpido. Se conservaron los resultados parciales.";

  const emptyMessage =
    analysis.status === "idle"
      ? "Inicia el análisis para recibir hallazgos."
      : running && analysis.findings.length === 0
        ? "Esperando el primer hallazgo…"
        : analysis.status === "completed" && analysis.findings.length === 0
          ? "El análisis terminó sin hallar inconsistencias."
          : "No hay hallazgos visibles. Revisa el filtro y el estado del análisis.";

  return (
    <ReviewDashboard
      project={projectState.project}
      findings={analysis.findings}
      emptyMessage={emptyMessage}
    >
      <div className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-600">
          Demostración con datos ficticios y transmisión SSE real.
        </p>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label
              htmlFor="scenario"
              className="mb-1 block text-sm font-medium"
            >
              Escenario de demostración
            </label>

            <select
              id="scenario"
              value={scenario}
              disabled={running}
              onChange={(event) => {
                const parsed = scenarioSchema.safeParse(event.target.value);
                if (parsed.success) setScenario(parsed.data);
              }}
              className="rounded-lg border border-slate-300 bg-white p-2"
            >
              <option value="success">Análisis exitoso</option>
              <option value="error">Error tras el primer hallazgo</option>
              <option value="empty">Sin hallazgos</option>
            </select>
          </div>

          <button
            type="button"
            onClick={startAnalysis}
            disabled={running}
            className={buttonClass}
          >
            {running
              ? "Analizando…"
              : analysis.status === "idle"
                ? "Analizar proyecto"
                : "Volver a analizar"}
          </button>

          {running && (
            <button
              type="button"
              onClick={cancelAnalysis}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100"
            >
              Cancelar
            </button>
          )}
        </div>

        <p role="status" className="text-sm text-slate-700">
          {statusText}
        </p>

        {analysis.status === "error" && (
          <p role="alert" className="text-sm text-red-700">
            {analysis.message}
          </p>
        )}

        {analysis.status !== "idle" && (
          <div>
            <progress
              aria-label="Hallazgos recibidos"
              max={Math.max(analysis.total ?? 1, 1)}
              value={
                analysis.total === null
                  ? undefined
                  : analysis.total === 0 && analysis.status === "completed"
                    ? 1
                    : analysis.findings.length
              }
              className="h-3 w-full accent-indigo-600"
            />

            <p className="mt-1 text-sm text-slate-600">
              {analysis.total === null
                ? "Conectando con el servidor…"
                : `${analysis.findings.length} de ${analysis.total} hallazgos recibidos`}
            </p>
          </div>
        )}
      </div>
    </ReviewDashboard>
  );
}
