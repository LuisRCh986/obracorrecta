"use client";

import { useState, type ReactNode } from "react";
import type { Finding, Project, Severity } from "@/types/review";

type SeverityFilter = "all" | Severity;

interface ReviewDashboardProps {
  project: Project;
  findings: Finding[];
  children?: ReactNode;
  emptyMessage?: string;
}

const severityLabels: Record<Severity, string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

const severityStyles: Record<Severity, string> = {
  high: "bg-red-100 text-red-800",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-blue-100 text-blue-800",
};

const disciplineLabels = {
  structures: "Estructuras",
  architecture: "Arquitectura",
};

const filters: { value: SeverityFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "high", label: "Alta" },
  { value: "medium", label: "Media" },
  { value: "low", label: "Baja" },
];

function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${severityStyles[severity]}`}
    >
      Gravedad {severityLabels[severity].toLowerCase()}
    </span>
  );
}

function SourcePanel({ finding }: { finding: Finding | null }) {
  return (
    <section
      aria-labelledby="source-heading"
      className="rounded-2xl border border-slate-200 bg-white p-6"
    >
      <h2 id="source-heading" className="text-lg font-semibold">
        Trazabilidad del hallazgo
      </h2>

      {!finding ? (
        <p className="mt-4 text-sm text-slate-600">
          No hay hallazgos visibles para consultar.
        </p>
      ) : (
        <div className="mt-5 space-y-5">
          <div>
            <p className="text-sm text-slate-500">
              Elemento {finding.elementId}
            </p>
            <h3 className="mt-1 font-semibold">{finding.title}</h3>
          </div>

          <dl className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <dt className="text-sm text-slate-600">En el modelo</dt>
              <dd className="mt-1 font-semibold">{finding.modelValue}</dd>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <dt className="text-sm text-slate-600">En el documento</dt>
              <dd className="mt-1 font-semibold">{finding.documentValue}</dd>
            </div>
          </dl>

          <div>
            <h3 className="text-sm font-semibold">Documento fuente</h3>
            <p className="mt-1 text-sm text-slate-600">
              {finding.source.documentTitle}
              {" · "}Página {finding.source.page}
            </p>

            <blockquote className="mt-3 border-l-4 border-indigo-500 bg-indigo-50 p-4 text-sm leading-6 text-slate-700">
              {finding.source.excerpt}
            </blockquote>
          </div>

          <p className="text-xs text-slate-500">
            Documento y fragmento ficticios para esta demostración.
          </p>
        </div>
      )}
    </section>
  );
}

export function ReviewDashboard({
  project,
  findings,
  children,
  emptyMessage = "No hay hallazgos con esta gravedad",
}: ReviewDashboardProps) {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visibleFindings = findings.filter(
    (finding) =>
      severityFilter === "all" || finding.severity === severityFilter,
  );

  const selectedFinding =
    visibleFindings.find((finding) => finding.id === selectedId) ??
    visibleFindings[0] ??
    null;

  function changeFilter(value: SeverityFilter) {
    setSeverityFilter(value);
    setSelectedId(null);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <p className="text-sm font-semibold tracking-wide text-indigo-700">
          OBRACORRECTA
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          {project.name}
        </h1>

        <p className="mt-2 text-slate-600">{project.description}</p>

        <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-sm text-indigo-900">
          {children}
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section aria-labelledby="findings-heading">
          <div className="mb-4">
            <h2 id="findings-heading" className="text-lg font-semibold">
              Hallazgos
            </h2>

            <p role="status" className="mt-1 text-sm text-slate-600">
              {visibleFindings.length} de {findings.length} visibles
            </p>
          </div>

          <fieldset className="mb-5">
            <legend className="mb-2 text-sm font-medium">
              Filtrar por gravedad
            </legend>

            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  aria-pressed={severityFilter === filter.value}
                  onClick={() => changeFilter(filter.value)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
                    severityFilter === filter.value
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </fieldset>

          {visibleFindings.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-600">
              {emptyMessage}
            </p>
          ) : (
            <ul className="space-y-3">
              {visibleFindings.map((finding) => (
                <li key={finding.id}>
                  <button
                    type="button"
                    aria-pressed={selectedFinding?.id === finding.id}
                    onClick={() => setSelectedId(finding.id)}
                    className={`w-full rounded-xl border bg-white p-5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
                      selectedFinding?.id === finding.id
                        ? "border-indigo-600 ring-1 ring-indigo-600"
                        : "border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    <SeverityBadge severity={finding.severity} />

                    <h3 className="mt-3 font-semibold">{finding.title}</h3>

                    <p className="mt-2 text-sm text-slate-600">
                      {disciplineLabels[finding.discipline]}
                      {" · "}Elemento {finding.elementId}
                    </p>

                    <p className="mt-3 text-sm font-medium text-indigo-700">
                      Consultar fuente
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <SourcePanel finding={selectedFinding} />
      </div>
    </main>
  );
}
