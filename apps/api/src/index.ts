import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { logger as honoLogger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { compress } from "hono/compress";
import { timing } from "hono/timing";
import { errorHandler } from "./middleware/errorHandler.ts";
import { logger } from "./lib/logger.ts";
import { connectNats } from "./lib/nats.ts";
import { ensureBucket } from "./lib/minio.ts";

// Route imports
import authRoutes from "./routes/auth.ts";
import userRoutes from "./routes/users.ts";
import orgRoutes from "./routes/organizations.ts";
import twinRoutes from "./routes/twins.ts";
import meetingRoutes from "./routes/meetings.ts";
import knowledgeRoutes from "./routes/knowledge.ts";
import emailRoutes from "./routes/email.ts";
import billingRoutes from "./routes/billing.ts";
import analyticsRoutes from "./routes/analytics.ts";
import notificationRoutes from "./routes/notifications.ts";
import integrationRoutes from "./routes/integrations.ts";
import adminRoutes from "./routes/admin.ts";
import webhookRoutes from "./routes/webhooks.ts";

const app = new Hono();

// ─── Global Middleware ───────────────────────────────────────────────────────
app.use("*", timing());
app.use("*", compress());
app.use(
  "*",
  cors({
    origin: (origin) => {
      const allowed = [
        process.env.FRONTEND_URL ?? "http://localhost:3000",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
      ];
      return allowed.includes(origin) ? origin : allowed[0];
    },
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-API-Key", "X-Request-ID"],
    exposeHeaders: ["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
    credentials: true,
    maxAge: 600,
  }),
);
app.use("*", secureHeaders());
app.use("*", honoLogger());
app.use("*", prettyJSON({ space: 2 }));

// ─── Health ──────────────────────────────────────────────────────────────────
app.get("/health", (c) =>
  c.json({
    status: "ok",
    service: "twinforce-api",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  }),
);

app.get("/", (c) => c.json({ message: "TwinForce API v1", docs: "/api/v1/docs" }));

// ─── API v1 Routes ───────────────────────────────────────────────────────────
const api = new Hono();

api.route("/auth", authRoutes);
api.route("/users", userRoutes);
api.route("/organizations", orgRoutes);
api.route("/twins", twinRoutes);
api.route("/meetings", meetingRoutes);
api.route("/knowledge", knowledgeRoutes);
api.route("/email", emailRoutes);
api.route("/billing", billingRoutes);
api.route("/analytics", analyticsRoutes);
api.route("/notifications", notificationRoutes);
api.route("/integrations", integrationRoutes);
api.route("/admin", adminRoutes);
api.route("/webhooks", webhookRoutes);

app.route("/api/v1", api);

// ─── Error Handler ───────────────────────────────────────────────────────────
app.onError(errorHandler);

app.notFound((c) => c.json({ success: false, error: "Route not found" }, 404));

// ─── Startup ─────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? "3001");

async function start() {
  try {
    await connectNats();
    await ensureBucket();
    logger.info({ port: PORT }, "Starting TwinForce API…");
  } catch (err) {
    logger.warn({ err }, "Non-fatal startup warning — some services may be unavailable");
  }
}

start().catch((err) => logger.error({ err }, "Startup failed"));

export default {
  port: PORT,
  fetch: app.fetch,
};
