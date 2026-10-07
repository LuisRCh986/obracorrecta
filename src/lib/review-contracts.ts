import { z } from "zod";
import type { Finding, Project } from "@/types/review";

const projectSchema: z.ZodType<Project> = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
});

const findingSchema: z.ZodType<Finding> = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  severity: z.enum(["high", "medium", "low"]),
  discipline: z.enum(["structures", "architecture"]),
  elementId: z.string().min(1),
  modelValue: z.string(),
  documentValue: z.string(),
  source: z.object({
    documentId: z.string().min(1),
    documentTitle: z.string().min(1),
    page: z.number().int().positive(),
    excerpt: z.string().min(1),
  }),
});

export const projectResponseSchema = z.object({
  project: projectSchema,
});

export const scenarioSchema = z.enum(["success", "error", "empty"]);

export type Scenario = z.infer<typeof scenarioSchema>;

export const analysisEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("started"),
    total: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal("finding"),
    finding: findingSchema,
  }),
  z.object({
    type: z.literal("completed"),
    total: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal("failed"),
    message: z.string().min(1),
  }),
]);

export type AnalysisEvent = z.infer<typeof analysisEventSchema>;
