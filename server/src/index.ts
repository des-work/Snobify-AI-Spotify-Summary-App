import path from "path";
import fs from "fs";
import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import { ConfigSchema, AppConfig } from "./config/schema.js";
import { logger } from "./observability/logger.js";
import { sendError } from "./errors/respond.js";
import { sha256File } from "./cache/hash.js";
import { readCsv } from "./ingest/readCsv.js";
import { compute } from "./compute/compute.js";

const reqId = ()=> Math.random().toString(36).slice(2,9);
const root = path.resolve(process.cwd(), "..");
const cfgPath = path.join(root, "snobify.config.json");
if(!fs.existsSync(cfgPath)) fs.writeFileSync(cfgPath, JSON.stringify({ profilesDir:"profiles", defaultProfile:"default", enableCloudAI:false, cloudAICostCapUSD:1, logging:{level:"info", pretty:true}}, null, 2));
const CONFIG: AppConfig = ConfigSchema.parse(JSON.parse(fs.readFileSync(cfgPath,"utf8")));
const PROFILES_DIR = path.join(root, CONFIG.profilesDir);

const app = Fastify({ logger: false });
await app.register(cors, { origin: true });

app.get("/api/health", async (req, reply) => {
  reply.send({ ok:true, uptime: process.uptime(), version: "0.2a" });
});

app.get("/api/profiles", async (req, reply)=>{
  const entries = fs.existsSync(PROFILES_DIR) ? fs.readdirSync(PROFILES_DIR, { withFileTypes: true }).filter(d=>d.isDirectory()).map(d=>d.name) : [];
  reply.send({ profiles: entries });
});

app.get("/api/stats", async (request: FastifyRequest, reply: FastifyReply)=>{
  const id = reqId();
  const q = (request.query as any) || {};
  const profile = q.profile || CONFIG.defaultProfile;
  const pdir = path.join(PROFILES_DIR, profile);
  const csv = path.join(pdir, "history.csv");
  reply.header("x-snobify-profile", profile);

  try{
    if(!fs.existsSync(pdir)) return sendError(reply, "ProfileNotFound", `Profile '${profile}' not found`, id, "Create folder profiles\\<name> with history.csv");
    if(!fs.existsSync(csv))  return sendError(reply, "CsvMissing", "CSV not found for profile", id, "Place your export at profiles\\<name>\\history.csv");

    const hash = sha256File(csv);
    reply.header("ETag", `W/"${hash}"`).header("x-snobify-hash", hash);

    const rows = await readCsv(csv);
    const stats = compute(rows);
    stats.meta.hash = hash;

    reply.header("Server-Timing", "compute;dur=1");
    reply.send({ profile, stats });

  }catch(err:any){
    logger.error({ err: String(err), reqId: id }, "stats failed");
    return sendError(reply, "Unknown", err?.message || "Unknown error", id);
  }
});

const PORT = Number(process.env.PORT || 8899);
app.listen({ port: PORT, host: "127.0.0.1" }).then(()=>{
  console.log(`Snobify server listening on http://127.0.0.1:${PORT}`);
}).catch(err=>{ console.error(err); process.exit(1); });
