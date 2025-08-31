import path from "path";
import fs from "fs";
import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import { ConfigSchema } from "./config/schema.ts";
import type { AppConfig } from "./config/schema.ts";
import { sendError } from "./errors/respond.ts";
import { sha256File } from "./cache/hash.ts";
import { readCsvAny } from "./ingest/readCsv.ts";
import { compute } from "./compute/compute.ts";

const reqId = ()=> Math.random().toString(36).slice(2,9);
const root = path.resolve(process.cwd(), "..");
const cfgPath = path.join(root, "snobify.config.json");
if(!fs.existsSync(cfgPath)) fs.writeFileSync(cfgPath, JSON.stringify({
  profilesDir:"profiles", defaultProfile:"default", enableCloudAI:false, cloudAICostCapUSD:1,
  logging:{level:"info", pretty:true},
  data:{ dropPreSpotify:true, cutoffMonth:"2008-10", maxCsvMb:15, topGenresLimit:15, weightedAverages:true, rareMode:"topN", rareN:25, rarePercentile:5 }
}, null, 2));
const CONFIG: AppConfig = ConfigSchema.parse(JSON.parse(fs.readFileSync(cfgPath,"utf8")));
const PROFILES_DIR = path.join(root, CONFIG.profilesDir);

const app = Fastify({ logger: false });
await app.register(cors, { origin: true });

function csvPathOrDir(pdir:string){
  const fileCsv = path.join(pdir, "history.csv");
  const dirCsv  = path.join(pdir, "history");
  return fs.existsSync(fileCsv) ? fileCsv : dirCsv;
}

app.get("/api/health", async (_req, reply) => {
  reply.send({ ok:true, uptime: process.uptime(), version: "0.3.0-phase1" });
});

app.get("/api/profiles", async (_req, reply)=>{
  const entries = fs.existsSync(PROFILES_DIR) ? fs.readdirSync(PROFILES_DIR, { withFileTypes: true }).filter(d=>d.isDirectory()).map(d=>d.name) : [];
  reply.send({ profiles: entries });
});

async function getStatsForProfile(profile:string){
  const pdir = path.join(PROFILES_DIR, profile);
  if(!fs.existsSync(pdir)) throw new Error("ProfileNotFound");
  const csvOrDir = csvPathOrDir(pdir);
  if(!fs.existsSync(csvOrDir)) throw new Error("CsvMissing");
  // Hash
  let hash = "";
  if (fs.existsSync(csvOrDir) && fs.statSync(csvOrDir).isFile()) {
    hash = sha256File(csvOrDir);
  } else {
    const files = fs.readdirSync(csvOrDir).filter(f=>f.toLowerCase().endsWith(".csv")).sort();
    const crypto = await import("crypto");
    const combined = files.map(f => sha256File(path.join(csvOrDir, f))).join("|");
    hash = crypto.createHash("sha256").update(combined).digest("hex");
  }
  const { rows, meta } = await readCsvAny(csvOrDir, { maxMb: CONFIG.data?.maxCsvMb ?? 15 });
  const stats = compute(rows, {
    cutoffMonth: CONFIG.data?.cutoffMonth, dropPreSpotify: CONFIG.data?.dropPreSpotify,
    topGenresLimit: CONFIG.data?.topGenresLimit, weightedAverages: CONFIG.data?.weightedAverages,
    rareMode: CONFIG.data?.rareMode, rareN: CONFIG.data?.rareN, rarePercentile: CONFIG.data?.rarePercentile
  });
  stats.meta.hash = hash;
  stats.meta.files = meta.files;
  stats.meta.rows = stats.meta.rows; // already unique plays count
  stats.meta.skipped = meta.skipped;
  return { stats, csvOrDir, hash, meta };
}

app.get("/api/stats", async (request: FastifyRequest, reply: FastifyReply)=>{
  const id = reqId();
  const q = (request.query as any) || {};
  const profile = q.profile || CONFIG.defaultProfile;
  reply.header("x-snobify-profile", profile);
  try {
    const { stats, hash } = await getStatsForProfile(profile);
    reply.header("ETag", `W/"${hash}"`).header("x-snobify-hash", hash);
    reply.header("Server-Timing", "compute;dur=1");
    reply.send({ profile, stats });
  } catch (err:any) {
    if(err?.message==="ProfileNotFound") return sendError(reply, "ProfileNotFound", `Profile '${profile}' not found`, id, "Create profiles\\<name> with history.csv or history\\*.csv");
    if(err?.message==="CsvMissing") return sendError(reply, "CsvMissing", "No CSV file or folder found for profile", id, "Place history.csv or a history\\ folder of CSVs in the profile");
    return sendError(reply, "Unknown", err?.message || "Unknown error", id);
  }
});

app.get("/api/recompute", async (request: FastifyRequest, reply: FastifyReply)=>{
  const id = reqId();
  const q = (request.query as any) || {};
  const profile = q.profile || CONFIG.defaultProfile;
  reply.header("Cache-Control", "no-store");
  try {
    const { stats, hash } = await getStatsForProfile(profile);
    reply.header("ETag", `W/"${hash}"`).header("x-snobify-hash", hash);
    reply.send({ profile, stats, recomputed: true });
  } catch (err:any) {
    if(err?.message==="ProfileNotFound") return sendError(reply, "ProfileNotFound", `Profile '${profile}' not found`, id);
    if(err?.message==="CsvMissing") return sendError(reply, "CsvMissing", "No CSV file or folder found for profile", id);
    return sendError(reply, "Unknown", err?.message || "Unknown error", id);
  }
});

app.get("/api/debug", async (request: FastifyRequest, reply: FastifyReply)=>{
  const id = reqId();
  const q = (request.query as any) || {};
  const profile = q.profile || CONFIG.defaultProfile;
  try {
    const { stats, csvOrDir, meta } = await getStatsForProfile(profile);
    const earliest = stats.meta.window.start;
    const latest = stats.meta.window.end;
    reply.send({
      profile,
      source: csvOrDir,
      files: meta.files,
      skippedRows: meta.skipped,
      uniqueTracks: stats._counters?.uniqueTracks ?? null,
      uniquePlays: stats.meta.rows,
      earliest, latest
    });
  } catch (err:any) {
    return sendError(reply, "Unknown", err?.message || "Unknown error", id);
  }
});

const PORT = Number(process.env.PORT || 8899);
app.listen({ port: PORT, host: "127.0.0.1" }).then(()=>{
  console.log(`Snobify server listening on http://127.0.0.1:${PORT}`);
}).catch(err=>{ console.error(err); process.exit(1); });