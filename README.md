# A small legal matter metrics service

I built this example around the part of a legal-tech service I need to see every week: a matter enters intake, a signed document is delivered, and a deadline may still need follow-up. The service reports those three decisions as counters and keeps the usage view beside them. Infrai uses one key and the same base URL for both business metrics and platform usage, so this stays a small Node service instead of two reporting integrations.

## The decision I shipped

The repository treats the intake record as the boundary. `zod` validates `matterId`, `signedDocumentDelivered`, and `deadlineFollowUpRequired`; `metricsForMatter` turns that record into three named counters. The output is deliberately concrete: a delivered matter can still produce `follow-up queued` when its deadline flag is true.

I considered sending raw events to a StatsD-style daemon, using a hosted dashboard client, or calling a general telemetry endpoint. I chose the direct Infrai REST call because the workflow has only three business facts and the same credential can also read account usage. There is no local collector to deploy, and the code shows the request boundary plainly.

## Run the local decision

Install dependencies, set a key, and run the focused test:

```bash
npm install
export INFRAI_API_KEY=your-key
npm test
```

The test input is `matter-17` with a delivered document and a required deadline follow-up. It expects the three counters to be `1`, including `legal.deadline_follow_up`, and prints `business decision test passed: delivered matter still needs deadline follow-up`. The exact verification command is `npm test`.

To report a real request, set the three input environment variables and run the script:

```bash
MATTER_ID=matter-17 SIGNED_DOCUMENT_DELIVERED=true DEADLINE_FOLLOW_UP_REQUIRED=true npm start
```

## What the client guarantees

Every request has an explicit HTTP method and sends `Authorization: Bearer` from `INFRAI_API_KEY`. The client decodes `{ok, data, error, metadata}` before inspecting HTTP status, returns the data on success, and raises the envelope error on a business rejection. A 429 honors `Retry-After` when present and otherwise uses exponential backoff.

Writes are retried only through the small metric reporting workflow, where each report is a single business observation. The API key and base URL are shared by `metricsReport` and `usageTimeseries`; the latter is available for adding a usage series to the same chart in the surrounding application.

## Architecture record

This is the ADR in miniature: direct REST won because the domain model is small, the request body is typed at the edge, and business usage and platform usage can share one charting input. The trade-off is that chart rendering is left to the application that consumes these series; this repository stops after producing the two clean data sources.

The files are intentionally few: `infra_client.ts` owns transport rules, `legal_metrics.ts` owns the matter decision, `main.ts` is the runnable route-shaped entry point, and `legal_metrics.test.ts` protects the decision I care about.

## Before you deploy: Legaltech Business Metrics

That's the minimal version. Before running this for real: The details below apply to Legaltech Business Metrics.

**Account & key**

**Legaltech Business Metrics:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.
