import type { Finding, Project } from "@/types/review";

export const demoProject: Project = {
  id: "project-demo",
  name: "Edificio Los Álamos",
  description: "Revisión de coordinación técnica — proyecto ficticio",
};

export const demoFindings: Finding[] = [
  {
    id: "finding-001",
    title: "Resistencia del concreto diferente",
    severity: "high",
    discipline: "structures",
    elementId: "C-12",
    modelValue: "210 kg/cm²",
    documentValue: "280 kg/cm²",
    source: {
      documentId: "doc-structures",
      documentTitle: "Especificaciones estructurales",
      page: 4,
      excerpt:
        "Las columnas del primer nivel deberán considerar una resistencia de concreto de 280 kg/cm².",
    },
  },
  {
    id: "finding-002",
    title: "Ancho de puerta diferente",
    severity: "medium",
    discipline: "architecture",
    elementId: "P-08",
    modelValue: "0.80 m",
    documentValue: "0.90 m",
    source: {
      documentId: "doc-architecture",
      documentTitle: "Memoria descriptiva de arquitectura",
      page: 7,
      excerpt:
        "La puerta P-08 tendrá un ancho de 0.90 m según el cuadro de carpintería.",
    },
  },
];
