import { setTimeout as delay } from "node:timers/promises";
import { demoProject } from "@/data/demo-project";
import { projectResponseSchema } from "@/lib/review-contracts";

export async function GET(request: Request) {
  const url = new URL(request.url);

  // Latencia añadida para simlur el estado de carga.
  await delay(700);

  if (url.searchParams.get("fail") === "1") {
    return Response.json(
      { message: "No se pudo cargar el proyecto de demostración." },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  const response = projectResponseSchema.parse({
    project: demoProject,
  });

  return Response.json(response, {
    headers: { "Cache-Control": "no-store" },
  });
}
