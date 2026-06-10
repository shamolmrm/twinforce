import { connect, type NatsConnection, type JetStreamManager, type JetStreamClient, StringCodec } from "nats";
import { logger } from "./logger.ts";

let nc: NatsConnection;
let jsm: JetStreamManager;
let js: JetStreamClient;

export const sc = StringCodec();

export async function connectNats(): Promise<NatsConnection> {
  if (!nc) {
    nc = await connect({ servers: process.env.NATS_URL ?? "nats://localhost:4222" });
    logger.info("NATS connected");
    jsm = await nc.jetstreamManager();
    js = nc.jetstream();

    // Ensure required streams exist
    const streams = [
      { name: "TWIN_EVENTS", subjects: ["twin.>"] },
      { name: "MEETING_EVENTS", subjects: ["meeting.>"] },
      { name: "EMAIL_EVENTS", subjects: ["email.>"] },
      { name: "KNOWLEDGE_EVENTS", subjects: ["knowledge.>"] },
      { name: "BILLING_EVENTS", subjects: ["billing.>"] },
    ];
    for (const s of streams) {
      try {
        await jsm.streams.add({ name: s.name, subjects: s.subjects });
      } catch {
        // Stream may already exist
      }
    }
  }
  return nc;
}

export function getNats(): NatsConnection {
  if (!nc) throw new Error("NATS not connected — call connectNats() first");
  return nc;
}

export function getJs(): JetStreamClient {
  if (!js) throw new Error("JetStream not ready");
  return js;
}

export async function publish(subject: string, data: unknown): Promise<void> {
  const j = getJs();
  await j.publish(subject, sc.encode(JSON.stringify(data)));
}
