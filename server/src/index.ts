import Fastify from "fastify";
import cors from "@fastify/cors";
import fs from "fs";
import { CONFIG, PROFILES_DIR } from "./config/index.js";
import { metricsText } from "./observability/metrics.js";
import { statsRoutes } from "./routes/statsRoutes.js";
import { mlRoutes } from "./routes/mlRoutes.js";

// ---------- server ----------
const app = Fastify({ logger: false });

app.setErrorHandler((err, request, reply) => {
  // dump to console and return JSON so our tests can read it
  console.error("[route-error]", request?.url, err);
  reply.status(500).send({ error: { message: err?.message || String(err), stack: err?.stack, url: request?.url } });
});

await app.register(cors, { origin: true });

app.get("/metrics", async (req, reply) => {
  reply.header("Content-Type", "text/plain; version=0.0.4");
  reply.send(metricsText());
});

app.get("/api/health", async (_req, reply) => {
  reply.send({ status: "ok", uptime: process.uptime() });
});

app.get("/api/profiles", async (_req, reply) => {
  const entries = fs.existsSync(PROFILES_DIR)
    ? fs.readdirSync(PROFILES_DIR, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name)
    : [];
  reply.send({ profiles: entries });
});

// Register routes
await app.register(statsRoutes);
await app.register(mlRoutes);

const PORT = Number(process.env.PORT || 8899);
try {
  await app.listen({ port: PORT, host: "127.0.0.1" });
  console.log(`Snobify server listening on http://127.0.0.1:${PORT}`);
  console.log(`ML Analysis enabled: ${CONFIG.ml?.enabled || false}`);
  console.log(`Data tracking: ${JSON.stringify(CONFIG.ml?.dataTracking || {})}`);
} catch (err) {
  console.error('Server startup failed:', err);
  process.exit(1);
}
