import { z } from "zod";
import { InfraiClient } from "./infra_client.js";

export const matterIntakeSchema = z.object({
  matterId: z.string().min(1),
  signedDocumentDelivered: z.boolean(),
  deadlineFollowUpRequired: z.boolean(),
});

export type MatterIntake = z.infer<typeof matterIntakeSchema>;

export function metricsForMatter(input: MatterIntake): Array<{ type: "counter"; name: string; value: number; tags: Record<string, string> }> {
  const matter = matterIntakeSchema.parse(input);
  const tags = { matter_id: matter.matterId };
  return [
    { type: "counter", name: "legal.matter_intake", value: 1, tags },
    { type: "counter", name: "legal.signed_document_delivery", value: matter.signedDocumentDelivered ? 1 : 0, tags },
    { type: "counter", name: "legal.deadline_follow_up", value: matter.deadlineFollowUpRequired ? 1 : 0, tags },
  ];
}

export async function reportMatter(client: InfraiClient, input: MatterIntake): Promise<string> {
  const metrics = metricsForMatter(input);
  for (const metric of metrics) await client.metricsReport(metric);
  return input.deadlineFollowUpRequired ? "follow-up queued" : "matter complete";
}
