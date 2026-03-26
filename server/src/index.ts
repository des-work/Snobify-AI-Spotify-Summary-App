import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import fs from "fs";
import { pipeline } from "stream/promises";
import path from "path";
import { CONFIG, PROFILES_DIR, ROOT_DIR } from "./config/index.js";
import { metricsText } from "./observability/metrics.js";
import { statsRoutes } from "./routes/statsRoutes.js";
import { mlRoutes } from "./routes/mlRoutes.js";

// ---------- crash guards ----------
process.on("uncaughtException", (err) => {
  console.error("[UNCAUGHT EXCEPTION] — server staying alive:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[UNHANDLED REJECTION] — server staying alive:", reason);
});

// ---------- server ----------
const app = Fastify({ logger: false });

app.setErrorHandler((err, request, reply) => {
  // Log full detail server-side (including stack), never expose it to the client
  console.error("[route-error]", request?.url, err);
  const statusCode = err.statusCode ?? 500;
  // Mirror the sendError shape so the frontend can always parse { error: { code, message, reqId } }
  reply.status(statusCode).send({
    error: {
      code: "SNB-9001",
      message: err?.message || "An unexpected error occurred",
      reqId: (request.headers["x-req-id"] as string) || "unknown",
      hint: statusCode >= 500 ? "An internal server error occurred. Check server logs for details." : undefined,
    }
  });
});

await app.register(cors, { origin: true });
await app.register(multipart, {
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB max per file
    files: 20,
  },
});

app.get("/metrics", async (_req, reply) => {
  reply.header("Content-Type", "text/plain; version=0.0.4");
  reply.send(metricsText());
});

app.get("/api/health", async (_req, reply) => {
  reply.send({ status: "ok", uptime: process.uptime() });
});

// ── File upload endpoint ──
// Accepts one or more CSV files via multipart form-data.
// Query param: ?profile=<name> (defaults to "default")
//
// Single file  → saved as profiles/<profile>/history.csv
// Multi files  → saved into  profiles/<profile>/history/<name>.csv
//
// Files are streamed directly to disk — no full-file buffering in memory.
app.post("/api/upload", async (req, reply) => {
  const q = (req.query as any) || {};
  const rawProfile = String(q.profile || CONFIG.defaultProfile).replace(/[^a-zA-Z0-9_-]/g, "");
  const profile = rawProfile || CONFIG.defaultProfile; // guard against all-special-char names becoming ""
  const profileDir = path.join(PROFILES_DIR, profile);
  fs.mkdirSync(profileDir, { recursive: true });

  // First pass: collect filenames and stream each to a temp path so we know
  // how many files arrived before deciding single-vs-multi layout.
  const tmpDir = path.join(profileDir, ".upload_tmp");
  fs.mkdirSync(tmpDir, { recursive: true });

  const incoming: { name: string; tmpPath: string; size: number }[] = [];
  const parts = req.parts();

  for await (const part of parts) {
    if (part.type !== "file") continue;
    const name = (part.filename || "upload.csv").replace(/[^a-zA-Z0-9._-]/g, "_");
    const tmpPath = path.join(tmpDir, name);
    try {
      await pipeline(part.file, fs.createWriteStream(tmpPath));
      const size = fs.statSync(tmpPath).size;
      incoming.push({ name, tmpPath, size });
    } catch (streamErr) {
      // Clean up partial file; continue with other files
      fs.rmSync(tmpPath, { force: true });
      console.error(`[upload] Failed to stream ${name}:`, streamErr);
    }
  }

  if (incoming.length === 0) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    return reply.status(400).send({
      error: { code: "SNB-1003", message: "No files uploaded", reqId: "upload", hint: "Attach at least one .csv file." }
    });
  }

  const saved: { filename: string; size: number; path: string }[] = [];

  if (incoming.length === 1) {
    // Single file → profiles/<profile>/history.csv
    const dest = path.join(profileDir, "history.csv");
    fs.renameSync(incoming[0].tmpPath, dest);
    saved.push({ filename: "history.csv", size: incoming[0].size, path: path.relative(ROOT_DIR, dest) });
  } else {
    // Multiple files → profiles/<profile>/history/<name>.csv
    const histDir = path.join(profileDir, "history");
    // Clear previous uploads in this directory
    if (fs.existsSync(histDir)) {
      for (const f of fs.readdirSync(histDir)) {
        if (f.toLowerCase().endsWith(".csv")) fs.unlinkSync(path.join(histDir, f));
      }
    }
    fs.mkdirSync(histDir, { recursive: true });
    for (const file of incoming) {
      const dest = path.join(histDir, file.name);
      fs.renameSync(file.tmpPath, dest);
      saved.push({ filename: file.name, size: file.size, path: path.relative(ROOT_DIR, dest) });
    }
    // Remove single-file history.csv so DataService picks the directory
    const singlePath = path.join(profileDir, "history.csv");
    if (fs.existsSync(singlePath)) fs.unlinkSync(singlePath);
  }

  // Clean up temp directory
  fs.rmSync(tmpDir, { recursive: true, force: true });

  const totalBytes = saved.reduce((s, f) => s + f.size, 0);
  console.log(`[upload] profile=${profile}, files=${saved.length}, totalBytes=${totalBytes}`);

  reply.send({
    profile,
    uploaded: saved.length,
    files: saved,
  });
});

// Register routes
await app.register(statsRoutes);
await app.register(mlRoutes);

const PORT = Number(process.env.PORT || 8899);
try {
  await app.listen({ port: PORT, host: "127.0.0.1" });
  console.log(`Snobify server listening on http://127.0.0.1:${PORT}`);
  console.log(`ML Analysis enabled: ${CONFIG.ml?.enabled || false}`);
  console.log(`Profiles dir: ${PROFILES_DIR}`);
} catch (err) {
  console.error('Server startup failed:', err);
  process.exit(1);
}
