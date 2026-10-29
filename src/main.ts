import { InfraiClient } from "./infra_client.js";
import { matterIntakeSchema, reportMatter } from "./legal_metrics.js";

const input = matterIntakeSchema.parse({
  matterId: process.env.MATTER_ID ?? "demo-matter",
  signedDocumentDelivered: process.env.SIGNED_DOCUMENT_DELIVERED === "true",
  deadlineFollowUpRequired: process.env.DEADLINE_FOLLOW_UP_REQUIRED === "true",
});

const client = new InfraiClient();
const decision = await reportMatter(client, input);
console.log(JSON.stringify({ matterId: input.matterId, decision }));
