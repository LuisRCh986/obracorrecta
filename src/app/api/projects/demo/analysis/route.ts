import { demoFindings } from "@/data/demo-project";
import { scenarioSchema, type AnalysisEvent } from "@/lib/review-contracts";

export async function GET(request: Request) {
  const url = new URL(request.url);

  const scenarioResult = scenarioSchema.safeParse(
    url.searchParams.get("scenario") ?? "success",
  );

  if (!scenarioResult.success) {
    return Response.json(
      { message: "Escenario de demostración inválido." },
      { status: 400 },
    );
  }

  const scenario = scenarioResult.data;
  const findings = scenario === "empty" ? [] : demoFindings;
  const encoder = new TextEncoder();

  let timer: ReturnType<typeof setInterval> | undefined;
  let stopped = false;
  let disconnect: () => void = () => {};

  function cleanup() {
    clearInterval(timer);
    request.signal.removeEventListener("abort", disconnect);
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      function send(event: AnalysisEvent) {
        if (stopped) return;

        const message =
          `event: analysis\n` + `data: ${JSON.stringify(event)}\n\n`;

        controller.enqueue(encoder.encode(message));
      }

      function finish() {
        if (stopped) return;

        stopped = true;
        cleanup();
        controller.close();
      }

      disconnect = finish;

      request.signal.addEventListener("abort", disconnect, {
        once: true,
      });

      if (request.signal.aborted) {
        finish();
        return;
      }

      send({
        type: "started",
        total: findings.length,
      });

      let index = 0;

      timer = setInterval(() => {
        if (stopped) return;

        if (scenario === "error" && index === 1) {
          send({
            type: "failed",
            message:
              "El análisis de demostración falló después del primer hallazgo.",
          });

          finish();
          return;
        }

        const finding = findings[index];

        if (finding) {
          send({ type: "finding", finding });
          index += 1;
          return;
        }

        send({
          type: "completed",
          total: findings.length,
        });

        finish();
      }, 1200);
    },

    cancel() {
      stopped = true;
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
