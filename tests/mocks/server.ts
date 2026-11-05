import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { emptyQualitySnapshot } from "@/lib/quality";

export const server = setupServer(
  http.get("*/api/quality", () => HttpResponse.json(emptyQualitySnapshot)),
);
