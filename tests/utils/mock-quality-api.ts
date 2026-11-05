import { http, HttpResponse } from "msw";
import {
  emptyQualitySnapshot,
  qualitySnapshotSchema,
  type QualitySnapshot,
} from "@/lib/quality";
import { server } from "../mocks/server";

export type MockedQualityRequest = {
  method: string;
  url: URL;
  headers: Headers;
  body: unknown;
};

export type MockQualityApiOptions = {
  get?: QualitySnapshot;
  post?: QualitySnapshot | ((body: unknown) => QualitySnapshot);
};

export function mockQualityApi(
  options: MockQualityApiOptions = {},
): { requests: MockedQualityRequest[] } {
  const requests: MockedQualityRequest[] = [];
  const getSnapshot = options.get ?? emptyQualitySnapshot;

  function record(request: Request, body: unknown = null) {
    requests.push({
      method: request.method,
      url: new URL(request.url),
      headers: request.headers,
      body,
    });
  }

  server.use(
    http.get("/api/quality", ({ request }) => {
      record(request);
      return HttpResponse.json(qualitySnapshotSchema.parse(getSnapshot));
    }),
    http.post("/api/quality", async ({ request }) => {
      const body = await request.clone().json().catch(() => null);
      record(request, body);
      const snapshot =
        typeof options.post === "function"
          ? options.post(body)
          : options.post ?? getSnapshot;
      return HttpResponse.json(qualitySnapshotSchema.parse(snapshot));
    }),
  );

  return { requests };
}
