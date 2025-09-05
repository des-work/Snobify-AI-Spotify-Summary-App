import { incRequest, metricsText, Timer, incError } from "./observability/metrics.js";

import path from "path";
import fs from "fs";
import { scoreOnePlaylist, rareEligibilityFromPlaylists } from "./compute/playlistScore.js";

import Fastify from "fastify";
import cors from "@fastify/cors";

import { ConfigSchema, type AppConfig } from "./config/schema.js";
import { logger } from "./observability/logger.js";

import { sendError } from "./errors/respond.js";

// Stats (original)
import readCsv from "./ingest/readCsv.js";
import { readAllCsvs, readPlaylistsAsMapLoose } from "./ingest/readAll.js";

import { compute } from "./compute/compute.js";

// New analysis
import { analyzeLibrary } from "./compute/libraryAnalysis.js";

import { buildTasteProfile } from "./compute/tasteProfile.js";
import { computePlaylistRatings } from "./compute/playlistRatings.js";

const reqId = ()=> Math.random().toString(36).slice(2,9);
const root = path.resolve(process.cwd(), "..");
const cfgPath = path.join(root, "snobify.config.json");

// Ensure config file exists
if(!fs.existsSync(cfgPath)){
  fs.writeFileSync(cfgPath, JSON.stringify({
    profilesDir:"profiles",
    defaultProfile:"default",
    enableCloudAI:false,
    cloudAICostCapUSD:1,
    logging:{ level:"info", pretty:true }
  }, null, 2));
}

const CONFIG: AppConfig = ConfigSchema.parse(JSON.parse(fs.readFileSync(cfgPath,"utf8")));
const PROFILES_DIR = path.join(root, CONFIG.profilesDir);

// ---------- utils ----------
const safeArr = <T>(x:any): T[] => Array.isArray(x) ? x as T[] : [];
const firstDateISO = (dates: Date[]) => dates.length ? dates[0].toISOString() : "";
const lastDateISO  = (dates: Date[]) => dates.length ? dates[dates.length - 1].toISOString() : "";

// ---------- server ----------
const app = Fastify({ logger: false });

app.setErrorHandler((err, request, reply) => {
  // dump to console and return JSON so our tests can read it
  console.error("[route-error]", request?.url, err);
  reply.status(500).send({ error: { message: err?.message || String(err), stack: err?.stack, url: request?.url } });
});
await app.register(cors, { origin: true });


app.get("/metrics", async (req, reply)=>{ reply.header("Content-Type","text/plain; version=0.0.4"); reply.send(metricsText()); });
app.get("/api/profiles", async (_req, reply) => {
  const entries = fs.existsSync(PROFILES_DIR)
    ? fs.readdirSync(PROFILES_DIR, { withFileTypes: true }).filter(d=>d.isDirectory()).map(d=>d.name)
    : [];
  reply.send({ profiles: entries });
});

// --- /api/stats ---
// Reads profiles/<name>/history.csv if present,
// else profiles/<name>/history/*.csv (merged) if folder exists.
app.get("/api/stats", async (request, reply) => {
      const id = reqId(); incRequest("/api/stats"); const timer = new Timer(); reply.header("x-req-id", id);
  const q = (request.query as any) || {};
  const profile = String(q.profile || CONFIG.defaultProfile);
  const pdir = path.join(PROFILES_DIR, profile);
  const hdir = path.join(pdir, "history");
  const singleCsv = path.join(pdir, "history.csv");
  reply.header("x-snobify-profile", profile);

  try{
    if(!fs.existsSync(pdir)) return sendError(reply, "ProfileNotFound", `Profile '${profile}' not found`, id, "Create folder profiles\\<name> with history.csv or history\\*.csv");

    let rows: any[] = [];
    if (fs.existsSync(singleCsv)) {
      rows = await readCsv(singleCsv);
    } else if (fs.existsSync(hdir) && fs.statSync(hdir).isDirectory()) {
      rows = await readAllCsvs(hdir);
    } else {
      return sendError(reply, "CsvMissing", "No CSV found for profile", id, "Place history.csv or history\\*.csv in the profile folder");
    }

    rows = safeArr<any>(rows);
    const dts = rows
      .map(r => new Date(r?.["Played At"] || r?.["Added At"] || r?.["Release Date"] || ""))
      .filter(d => !isNaN(d.getTime()))
      .sort((a,b)=>a.getTime()-b.getTime());

    const stats = compute(rows); timer.lap("compute");
    // plug a stable-ish hash if missing
    if (!stats?.meta?.hash) {
      const h = String(rows.length) + ":" + firstDateISO(dts) + ":" + lastDateISO(dts);
      (stats as any).meta = { ...(stats as any).meta, hash: Buffer.from(h).toString("base64url") };
    }

    // Server-Timing placeholder
    reply.header("Server-Timing", timer.header());
    reply.send({ profile, stats });
  } catch(err:any){ incError("/api/taste-profile"); incError("/api/stats");
    logger.error({ err: String(err), reqId: id }, "stats failed");
    return sendError(reply, "Unknown", err?.message || "Unknown error", id);
  }
});

// --- /api/debug ---
app.get("/api/debug", async (request, reply) => {
    const id = reqId(); incRequest("/api/debug"); const timer = new Timer(); reply.header("x-req-id", id);
  const q = (request.query as any) || {};
  const profile = String(q.profile || CONFIG.defaultProfile);
  const histOnly = String(q.histOnly ?? "1") !== "0"; // default: history-only
  const pdir = path.join(PROFILES_DIR, profile);
  const hdir = path.join(pdir, "history");
  reply.header("x-snobify-profile", profile);

  try{
    if (!fs.existsSync(pdir)) return sendError(reply, "ProfileNotFound", `Profile '${profile}' not found`, id, "Create folder profiles\\<name> with history\\*.csv");
    if (!fs.existsSync(hdir) || !fs.statSync(hdir).isDirectory()) {
      return sendError(reply, "CsvMissing", "history folder not found for profile", id, "Place CSVs at profiles\\<name>\\history\\*.csv");
    }

    const rowsAll = safeArr<any>(await readAllCsvs(hdir));
    const libraryRows = histOnly
      ? rowsAll.filter(r => String(r?.["Played At"] || "").trim() !== "")
      : rowsAll;

    // Guarded computations
    let playlistRatings: any[] = [];
    try { playlistRatings = computePlaylistRatings(rowsAll); }
    catch(e){ logger.error({err:String(e), where:"computePlaylistRatings", reqId:id}); playlistRatings = []; }

    let library: any = { timeDepth:{}, vintageGenresTop:[], topGenresAll:[], topGenresModern:[], genreContrast:0, favoritesPerGenre:[] };
    try { library = analyzeLibrary(libraryRows); }
    catch(e){ logger.error({err:String(e), where:"analyzeLibrary", reqId:id}); }

    const dates = libraryRows
      .map(r => new Date(r?.["Played At"] || r?.["Added At"] || r?.["Release Date"] || ""))
      .filter(d => !isNaN(d.getTime()))
      .sort((a,b)=>a.getTime()-b.getTime());

    const files = (() => {
      try { return safeArr(fs.readdirSync(hdir)).filter(f => f.toLowerCase().endsWith(".csv")).length; }
      catch { return 0; }
    })();

    const meta = {
      files,
      rows: rowsAll.length,
      window: { start: firstDateISO(dates), end: lastDateISO(dates) }
    };

    reply.send({ profile, playlistRatings, library, meta });
  } catch(err:any){ incError("/api/taste-profile"); incError("/api/stats");
    logger.error({ err: String(err), reqId: id }, "ratings failed");
    return sendError(reply, "Unknown", err?.message || "Unknown error", id);
  }
});

app.get("/api/taste-profile", async (request, reply) => {
    const id = reqId(); incRequest("/api/taste-profile"); const timer = new Timer(); reply.header("x-req-id", id);
  const q = (request.query as any) || {};
  const profile = String(q.profile || CONFIG.defaultProfile);
  const pdir = path.join(PROFILES_DIR, profile);
  const hdir = path.join(pdir, "history");
  reply.header("x-snobify-profile", profile);

  try{
    if (!fs.existsSync(pdir)) return sendError(reply, "ProfileNotFound", `Profile '${profile}' not found`, id, "Create profiles\\<name>\\history\\*.csv");
    if (!fs.existsSync(hdir) || !fs.statSync(hdir).isDirectory()) {
      return sendError(reply, "CsvMissing", "history folder not found for profile", id, "Place CSVs at profiles\\<name>\\history\\*.csv");
    }

    const rowsAll = await readAllCsvs(hdir); timer.lap("read");
    const tp = buildTasteProfile(Array.isArray(rowsAll) ? rowsAll : [], {
      nichePopularityThreshold: 31,   // Spotify-9 (more niche)
      playWeight: 0.7, uniqueWeight: 0.3,
      recencyBoostMax: 0.10,
      notYouDownweight: 0.5, userAliases: [], // set your username(s) later
      playlistWeightCapPct: 35,
      minRows: 300
    });

    const dates = (Array.isArray(rowsAll) ? rowsAll : [])
      .map(r => new Date((r as any)?.["Played At"] || (r as any)?.["Added At"] || (r as any)?.["Release Date"] || ""))
      .filter(d => !isNaN(d.getTime()))
      .sort((a,b)=>a.getTime()-b.getTime());

    reply.send({ profile, taste: tp, meta: {
      rows: Array.isArray(rowsAll) ? rowsAll.length : 0,
      window: { start: dates.length?dates[0].toISOString():"", end: dates.length?dates[dates.length-1].toISOString():"" }
    }});
  } catch(err:any){ incError("/api/taste-profile"); incError("/api/stats");
    logger.error({ err: String(err), reqId: id }, "taste-profile failed");
    return sendError(reply, "Unknown", err?.message || "Unknown error", id);
  }
});
app.get("/api/playlist-scores", async (request, reply) => {
  const id = reqId();
  incRequest("/api/playlist-scores");
  const timer = new Timer();
  reply.header("x-req-id", id);

  try {
    const q = (request.query as any) || {};
    const profile = String(q.profile || CONFIG.defaultProfile);
    const pdir = path.join(PROFILES_DIR, profile);
    const hdir = path.join(pdir, "history");
    reply.header("x-snobify-profile", profile);

    if (!fs.existsSync(pdir)) {
      return sendError(reply, "ProfileNotFound", `Profile '${profile}' not found`, id, "Create profiles\\<name>\\history\\*.csv");
    }
    if (!fs.existsSync(hdir) || !fs.statSync(hdir).isDirectory()) {
      return sendError(reply, "CsvMissing", "history folder not found for profile", id, "Place CSVs at profiles\\<name>\\history\\*.csv");
    }

    const by = await readPlaylistsAsMapLoose(hdir);
const scores = [...by.entries()].map(([name, rows]) => scoreOnePlaylist(name, rows));
    scores.sort((a,b)=> b.score - a.score);

    const rare = rareEligibilityFromPlaylists(scores);

    reply.header("server-timing", timer.total("playlist-scores"));
    reply.send({ profile, rare, scores, meta: { playlists: scores.length } });
  } catch (err:any) {
    incError("/api/playlist-scores");
    logger?.error?.({ err: String(err), reqId: id }, "playlist-scores failed");
    return sendError(reply, "Unknown", err?.message || "Unknown error", id);
  }
});
const PORT = Number(process.env.PORT || 8899);
app.listen({ port: PORT, host: "127.0.0.1" }).then(()=>{
  console.log(`Snobify server listening on http://127.0.0.1:${PORT}`);
}).catch(err=>{ console.error(err); process.exit(1); });
