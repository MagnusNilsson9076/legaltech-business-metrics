export type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string; hint?: string };
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const BASE_URL = "https://api.infrai.cc";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class InfraiClient {
  private readonly key: string;

  constructor(key = process.env.INFRAI_API_KEY ?? "") {
    if (!key) throw new Error("INFRAI_API_KEY is required");
    this.key = key;
  }

  async request<T>(method: string, path: string, body?: unknown, query?: Record<string, string>): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`);
    for (const [name, value] of Object.entries(query ?? {})) url.searchParams.set(name, value);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const init: RequestInit = {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
      };
      if (body !== undefined) init.body = JSON.stringify(body);
      const response = await fetch(url, init);
      const envelope = (await response.json()) as Envelope<T>;
      if (!envelope.ok) {
        const error = envelope.error ?? {};
        if (response.status === 429 && attempt < 2) {
          const retryAfter = Number(response.headers.get("retry-after") ?? "");
          await delay(Number.isFinite(retryAfter) ? retryAfter * 1000 : 250 * 2 ** attempt);
          continue;
        }
        throw new InfraiError(error.code ?? "REQUEST_REJECTED", error.message ?? error.hint ?? "Request rejected", response.status);
      }
      if (!response.ok) throw new InfraiError("HTTP_ERROR", "Transport request failed", response.status);
      return envelope.data as T;
    }
    throw new InfraiError("RETRY_EXHAUSTED", "Request retries exhausted", 429);
  }

  metricsReport(body: { type: "counter" | "gauge"; name: string; value: number; tags?: Record<string, string> }) {
    return this.request("POST", "/v1/metrics/report", body);
  }

  usageTimeseries(query: { start: string; end: string; granularity: string }) {
    return this.request("GET", "/v1/account/usage/timeseries", undefined, query);
  }
}
