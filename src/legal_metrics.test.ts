import assert from "node:assert/strict";
import { metricsForMatter } from "./legal_metrics.js";

const metrics = metricsForMatter({
  matterId: "matter-17",
  signedDocumentDelivered: true,
  deadlineFollowUpRequired: true,
});

assert.deepEqual(metrics.map((metric) => [metric.name, metric.value]), [
  ["legal.matter_intake", 1],
  ["legal.signed_document_delivery", 1],
  ["legal.deadline_follow_up", 1],
]);
console.log("business decision test passed: delivered matter still needs deadline follow-up");
