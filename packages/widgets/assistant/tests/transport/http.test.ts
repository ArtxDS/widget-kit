import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../../../tests/mocks/server";
import type {
  AssistantEvent,
  AssistantRequest,
} from "../../src/core";
import { HttpTransport } from "../../src/transport";

const ENDPOINT = "http://localhost/api/assistant";

function request(): AssistantRequest {
  return { protocolVersion: "1", messages: [] };
}

function events(): AssistantEvent[] {
  return [
    { type: "run-start", runId: "run-1" },
    { type: "message-start", messageId: "message-1", role: "assistant" },
    {
      type: "part-start",
      messageId: "message-1",
      part: { type: "text", id: "part-1", text: "" },
    },
    {
      type: "text-delta",
      messageId: "message-1",
      partId: "part-1",
      delta: "Hello",
    },
    { type: "message-end", messageId: "message-1" },
    { type: "run-end", runId: "run-1", status: "completed" },
  ];
}

async function collect(
  iterable: AsyncIterable<AssistantEvent>,
): Promise<AssistantEvent[]> {
  const received: AssistantEvent[] = [];
  for await (const event of iterable) {
    received.push(event);
  }
  return received;
}

describe("HttpTransport", () => {
  it("posts the request and parses JSON responses", async () => {
    const expected = events();
    let body: unknown;
    let headers: Headers | undefined;

    server.use(
      http.post(ENDPOINT, async ({ request: received }) => {
        body = await received.json();
        headers = received.headers;
        return HttpResponse.json(expected);
      }),
    );

    const transport = new HttpTransport({
      endpoint: ENDPOINT,
      headers: async () => ({ "x-api-key": "secret" }),
    });

    await expect(collect(transport.send(request()))).resolves.toEqual(expected);
    expect(body).toEqual(request());
    expect(headers?.get("accept")).toBe("text/event-stream");
    expect(headers?.get("content-type")).toBe("application/json");
    expect(headers?.get("x-api-key")).toBe("secret");
  });

  it("parses a JSON object with an events array", async () => {
    const expected = events();

    server.use(
      http.post(ENDPOINT, () =>
        HttpResponse.json({ events: expected }),
      ),
    );

    const transport = new HttpTransport({ endpoint: ENDPOINT });
    await expect(collect(transport.send(request()))).resolves.toEqual(expected);
  });

  it("parses NDJSON responses", async () => {
    const expected = events();
    const body = expected.map((event) => JSON.stringify(event)).join("\n");

    server.use(
      http.post(ENDPOINT, () =>
        HttpResponse.text(body, {
          headers: { "Content-Type": "application/x-ndjson" },
        }),
      ),
    );

    const transport = new HttpTransport({
      endpoint: ENDPOINT,
      accept: "application/x-ndjson",
    });

    await expect(collect(transport.send(request()))).resolves.toEqual(expected);
  });

  it("parses SSE frames split across chunks", async () => {
    const expected = events();
    const first = expected[0];
    const second = expected[1];
    const last = expected[expected.length - 1];

    server.use(
      http.post(ENDPOINT, () => {
        const encoder = new TextEncoder();
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(encoder.encode(": keep-alive\n\n"));
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(first)}\n\n`),
            );
            const frame = `data: ${JSON.stringify(second)}`;
            controller.enqueue(encoder.encode(frame.slice(0, 10)));
            controller.enqueue(encoder.encode(`${frame.slice(10)}\n\n`));
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify(last)}\n\ndata: [DONE]\n\n`,
              ),
            );
            controller.close();
          },
        });
        return new HttpResponse(stream, {
          headers: { "Content-Type": "text/event-stream" },
        });
      }),
    );

    const transport = new HttpTransport({ endpoint: ENDPOINT });
    await expect(collect(transport.send(request()))).resolves.toEqual([
      first,
      second,
      last,
    ]);
  });

  it("reports HTTP failures with response details", async () => {
    server.use(
      http.post(
        ENDPOINT,
        () =>
          new HttpResponse("upstream down", {
            status: 503,
            statusText: "Service Unavailable",
          }),
      ),
    );

    const transport = new HttpTransport({ endpoint: ENDPOINT });
    await expect(collect(transport.send(request()))).rejects.toMatchObject({
      code: "transport",
      retryable: true,
      details: { status: 503, body: "upstream down" },
    });
  });

  it("reports network failures", async () => {
    server.use(http.post(ENDPOINT, () => HttpResponse.error()));

    const transport = new HttpTransport({ endpoint: ENDPOINT });
    await expect(collect(transport.send(request()))).rejects.toMatchObject({
      code: "transport",
      retryable: true,
    });
  });

  it("times out slow requests", async () => {
    server.use(
      http.post(ENDPOINT, async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return HttpResponse.json(events());
      }),
    );

    const transport = new HttpTransport({ endpoint: ENDPOINT, timeoutMs: 20 });
    await expect(collect(transport.send(request()))).rejects.toMatchObject({
      code: "timeout",
      retryable: true,
    });
  });

  it("aborts in-flight requests", async () => {
    server.use(
      http.post(ENDPOINT, async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return HttpResponse.json(events());
      }),
    );

    const controller = new AbortController();
    const transport = new HttpTransport({ endpoint: ENDPOINT });
    const pending = collect(
      transport.send(request(), { signal: controller.signal }),
    );
    setTimeout(() => controller.abort(), 10);

    await expect(pending).rejects.toMatchObject({ code: "aborted" });
  });

  it("rejects malformed JSON responses", async () => {
    server.use(
      http.post(ENDPOINT, () =>
        HttpResponse.text("{not-json", {
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const transport = new HttpTransport({ endpoint: ENDPOINT });
    await expect(collect(transport.send(request()))).rejects.toMatchObject({
      code: "invalid-response",
    });
  });
});
