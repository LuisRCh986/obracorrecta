export type Severity = "high" | "medium" | "low";

export type Discipline = "structures" | "architecture";

export interface DocumentSource {
  documentId: string;
  documentTitle: string;
  page: number;
  excerpt: string;
}

export interface Finding {
  id: string;
  title: string;
  severity: Severity;
  discipline: Discipline;
  elementId: string;
  modelValue: string;
  documentValue: string;
  source: DocumentSource;
}

export interface Project {
  id: string;
  name: string;
  description: string;
}
