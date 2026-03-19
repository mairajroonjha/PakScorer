import { NextRequest } from "next/server";
import { subscribeEvent } from "@/lib/events";

export const runtime = "nodejs";

export async function GET(_request: NextRequest) {
  let unsubscribe: (() => void) | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      unsubscribe = subscribeEvent((event) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      });
      controller.enqueue(encoder.encode("event: hello\ndata: connected\n\n"));
      heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode("event: heartbeat\ndata: alive\n\n"));
      }, 20000);
    },
    cancel() {
      if (heartbeat) {
        clearInterval(heartbeat);
      }
      unsubscribe?.();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
