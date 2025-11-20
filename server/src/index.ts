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

// ML imports
import { MusicMLAnalyzer } from "./ml/analyzer.js";
import { GenreClassifier } from "./ml/genreClassifier.js";
import { MoodPredictor } from "./ml/moodPredictor.js";
import { ArtistClusterer } from "./ml/artistClusterer.js";
import { RecommendationEngine } from "./ml/recommendationEngine.js";

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
    logging:{ level:"info", pretty:true },
    ml: {
      enabled: true,
      models: {
        genre: true,
        mood: true,
        clustering: true,
        recommendations: true
      },
      dataTracking: {
        trackMetadata: true,
        genreClassifications: true,
        moodPredictions: true,
        artistClusters: true,
        userInteractions: false,
        personalData: false
      }
    }
  }, null, 2));
}

const CONFIG: AppConfig = ConfigSchema.parse(JSON.parse(fs.readFileSync(cfgPath,"utf8")));
const PROFILES_DIR = path.join(root, CONFIG.profilesDir);

// Initialize ML components
const mlAnalyzer = new MusicMLAnalyzer();
const genreClassifier = new GenreClassifier();
const moodPredictor = new MoodPredictor();
const artistClusterer = new ArtistClusterer();
const recommendationEngine = new RecommendationEngine();

// ---------- utils ----------
const safeArr = <T>(x:any): T[] => Array.isArray(x) ? x as T[] : [];
const firstDateISO = (dates: Date[]) => dates.length ? dates[0].toISOString() : "";
const lastDateISO  = (dates: Date[]) => dates.length ? dates[dates.length - 1].toISOString() : "";

// Enhanced data path resolution
const getDataPath = (profile: string) => {
  const root = path.resolve(process.cwd(), "..");
  const profilesDir = path.join(root, CONFIG.profilesDir);
  const pdir = path.join(profilesDir, profile);
  const hdir = path.join(pdir, "history");
  const singleCsv = path.join(pdir, "history.csv");
  
  // Check if we have data in the Music data folder
  const musicDataDir = path.join(root, "Music data", "spotify_playlists");
  
  if (fs.existsSync(musicDataDir)) {
    // Use the Music data folder if it exists
    return { 
      isDirectory: true, 
      path: musicDataDir,
      type: 'music_data'
    };
  }
  
  // Fall back to profile-based structure
  if (fs.existsSync(singleCsv)) {
    return { 
      isDirectory: false, 
      path: singleCsv,
      type: 'single_csv'
    };
  } else if (fs.existsSync(hdir) && fs.statSync(hdir).isDirectory()) {
    return { 
      isDirectory: true, 
      path: hdir,
      type: 'profile_history'
    };
  }
  
  return null;
};

// ---------- server ----------
const app = Fastify({ logger: false });

app.setErrorHandler((err, request, reply) => {
  // dump to console and return JSON so our tests can read it
  console.error("[route-error]", request?.url, err);
  reply.status(500).send({ error: { message: err?.message || String(err), stack: err?.stack, url: request?.url } });
});
await app.register(cors, { origin: true });

app.get("/metrics", async (req, reply)=>{ reply.header("Content-Type","text/plain; version=0.0.4"); reply.send(metricsText()); });

app.get("/api/health", async (_req, reply) => {
  reply.send({ status: "ok", uptime: process.uptime() });
});

app.get("/api/profiles", async (_req, reply) => {
  const entries = fs.existsSync(PROFILES_DIR)
    ? fs.readdirSync(PROFILES_DIR, { withFileTypes: true }).filter(d=>d.isDirectory()).map(d=>d.name)
    : [];
  reply.send({ profiles: entries });
});

// --- /api/stats ---
app.get("/api/stats", async (request, reply) => {
  const id = reqId(); incRequest("/api/stats"); const timer = new Timer(); reply.header("x-req-id", id);
  const q = (request.query as any) || {};
  const profile = String(q.profile || CONFIG.defaultProfile);
  reply.header("x-snobify-profile", profile);

  try{
    const dataPath = getDataPath(profile);
    if (!dataPath) {
      return sendError(reply, "DataNotFound", "No music data found", id, "Place CSV files in Music data/spotify_playlists/ or profiles/<name>/history.csv");
    }

    let rows: any[] = [];
    if (dataPath.isDirectory) {
      console.log(`Reading data from directory: ${dataPath.path}`);
      rows = await readAllCsvs(dataPath.path);
    } else {
      console.log(`Reading data from file: ${dataPath.path}`);
      rows = await readCsv(dataPath.path);
    }

    rows = safeArr<any>(rows);
    console.log(`Loaded ${rows.length} tracks from ${dataPath.type}`);
    
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
  } catch(err:any){ incError("/api/stats");
    logger.error({ err: String(err), reqId: id }, "stats failed");
    return sendError(reply, "Unknown", err?.message || "Unknown error", id);
  }
});

// --- /api/ml-analysis ---
app.get("/api/ml-analysis", async (request, reply) => {
  const id = reqId(); incRequest("/api/ml-analysis"); const timer = new Timer(); reply.header("x-req-id", id);
  const q = (request.query as any) || {};
  const profile = String(q.profile || CONFIG.defaultProfile);
  reply.header("x-snobify-profile", profile);

  try{
    const dataPath = getDataPath(profile);
    if (!dataPath) {
      return sendError(reply, "DataNotFound", "No music data found", id);
    }

    let rows: any[] = [];
    if (dataPath.isDirectory) {
      rows = await readAllCsvs(dataPath.path);
    } else {
      rows = await readCsv(dataPath.path);
    }

    rows = safeArr<any>(rows);
    
    // Run ML analysis
    const mlResults = await mlAnalyzer.analyze(rows);
    
    reply.header("Server-Timing", timer.header());
    reply.send({ 
      profile, 
      mlResults,
      dataTracking: CONFIG.ml?.dataTracking || {}
    });
  } catch(err:any){ 
    incError("/api/ml-analysis");
    logger.error({ err: String(err), reqId: id }, "ML analysis failed");
    return sendError(reply, "Unknown", err?.message || "Unknown error", id);
  }
});

// --- /api/genre-classification ---
app.get("/api/genre-classification", async (request, reply) => {
  const id = reqId(); incRequest("/api/genre-classification"); const timer = new Timer(); reply.header("x-req-id", id);
  const q = (request.query as any) || {};
  const profile = String(q.profile || CONFIG.defaultProfile);
  reply.header("x-snobify-profile", profile);

  try{
    const dataPath = getDataPath(profile);
    if (!dataPath) {
      return sendError(reply, "DataNotFound", "No music data found", id);
    }

    let rows: any[] = [];
    if (dataPath.isDirectory) {
      rows = await readAllCsvs(dataPath.path);
    } else {
      rows = await readCsv(dataPath.path);
    }

    rows = safeArr<any>(rows);
    
    // Run genre classification
    const genreResults = await genreClassifier.classify(rows);
    
    reply.header("Server-Timing", timer.header());
    reply.send({ profile, genreResults });
  } catch(err:any){ 
    incError("/api/genre-classification");
    logger.error({ err: String(err), reqId: id }, "Genre classification failed");
    return sendError(reply, "Unknown", err?.message || "Unknown error", id);
  }
});

// --- /api/mood-prediction ---
app.get("/api/mood-prediction", async (request, reply) => {
  const id = reqId(); incRequest("/api/mood-prediction"); const timer = new Timer(); reply.header("x-req-id", id);
  const q = (request.query as any) || {};
  const profile = String(q.profile || CONFIG.defaultProfile);
  reply.header("x-snobify-profile", profile);

  try{
    const dataPath = getDataPath(profile);
    if (!dataPath) {
      return sendError(reply, "DataNotFound", "No music data found", id);
    }

    let rows: any[] = [];
    if (dataPath.isDirectory) {
      rows = await readAllCsvs(dataPath.path);
    } else {
      rows = await readCsv(dataPath.path);
    }

    rows = safeArr<any>(rows);
    
    // Run mood prediction
    const moodResults = await moodPredictor.predict(rows);
    
    reply.header("Server-Timing", timer.header());
    reply.send({ profile, moodResults });
  } catch(err:any){ 
    incError("/api/mood-prediction");
    logger.error({ err: String(err), reqId: id }, "Mood prediction failed");
    return sendError(reply, "Unknown", err?.message || "Unknown error", id);
  }
});

// --- /api/mood-training ---
app.post("/api/mood-training", async (request, reply) => {
  const id = reqId(); incRequest("/api/mood-training"); const timer = new Timer(); reply.header("x-req-id", id);
  const q = (request.query as any) || {};
  const profile = String(q.profile || CONFIG.defaultProfile);
  reply.header("x-snobify-profile", profile);

  try{
    const dataPath = getDataPath(profile);
    if (!dataPath) {
      return sendError(reply, "DataNotFound", "No music data found", id);
    }

    let rows: any[] = [];
    if (dataPath.isDirectory) {
      rows = await readAllCsvs(dataPath.path);
    } else {
      rows = await readCsv(dataPath.path);
    }

    rows = safeArr<any>(rows);
    
    // Prepare training data from existing predictions
    const trainingData = [];
    for (const track of rows.slice(0, 100)) { // Use first 100 tracks for training
      const audioFeatures = {
        valence: track.valence || 0,
        energy: track.energy || 0,
        danceability: track.danceability || 0,
        acousticness: track.acousticness || 0,
        tempo: track.tempo || 120
      };
      
      // Use a simple heuristic to generate training labels
      let mood = 'Happy';
      if (audioFeatures.valence < 0.3) mood = 'Sad';
      else if (audioFeatures.valence > 0.7 && audioFeatures.energy > 0.7) mood = 'Excited';
      else if (audioFeatures.energy > 0.6) mood = 'Energetic';
      else if (audioFeatures.energy < 0.3) mood = 'Calm';
      
      trainingData.push({
        features: audioFeatures,
        mood,
        confidence: 0.8
      });
    }
    
    // Train the model
    await moodPredictor.trainModel(trainingData);
    
    reply.header("Server-Timing", timer.header());
    reply.send({ 
      profile, 
      trainingSamples: trainingData.length,
      modelTrained: true,
      message: "Mood prediction model trained successfully"
    });
  } catch(err:any){ 
    incError("/api/mood-training");
    logger.error({ err: String(err), reqId: id }, "Mood training failed");
    return sendError(reply, "Unknown", err?.message || "Unknown error", id);
  }
});

// --- /api/artist-clustering ---
app.get("/api/artist-clustering", async (request, reply) => {
  const id = reqId(); incRequest("/api/artist-clustering"); const timer = new Timer(); reply.header("x-req-id", id);
  const q = (request.query as any) || {};
  const profile = String(q.profile || CONFIG.defaultProfile);
  reply.header("x-snobify-profile", profile);

  try{
    const dataPath = getDataPath(profile);
    if (!dataPath) {
      return sendError(reply, "DataNotFound", "No music data found", id);
    }

    let rows: any[] = [];
    if (dataPath.isDirectory) {
      rows = await readAllCsvs(dataPath.path);
    } else {
      rows = await readCsv(dataPath.path);
    }

    rows = safeArr<any>(rows);
    
    // Run artist clustering
    const clusterResults = await artistClusterer.cluster(rows);
    
    reply.header("Server-Timing", timer.header());
    reply.send({ profile, clusterResults });
  } catch(err:any){ 
    incError("/api/artist-clustering");
    logger.error({ err: String(err), reqId: id }, "Artist clustering failed");
    return sendError(reply, "Unknown", err?.message || "Unknown error", id);
  }
});

// --- /api/recommendations ---
app.get("/api/recommendations", async (request, reply) => {
  const id = reqId(); incRequest("/api/recommendations"); const timer = new Timer(); reply.header("x-req-id", id);
  const q = (request.query as any) || {};
  const profile = String(q.profile || CONFIG.defaultProfile);
  const limit = parseInt(q.limit || "10");
  reply.header("x-snobify-profile", profile);

  try{
    const dataPath = getDataPath(profile);
    if (!dataPath) {
      return sendError(reply, "DataNotFound", "No music data found", id);
    }

    let rows: any[] = [];
    if (dataPath.isDirectory) {
      rows = await readAllCsvs(dataPath.path);
    } else {
      rows = await readCsv(dataPath.path);
    }

    rows = safeArr<any>(rows);
    
    // Generate recommendations
    const recommendations = await recommendationEngine.recommend(rows, limit);
    
    reply.header("Server-Timing", timer.header());
    reply.send({ profile, recommendations });
  } catch(err:any){ 
    incError("/api/recommendations");
    logger.error({ err: String(err), reqId: id }, "Recommendations failed");
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
    const dataPath = getDataPath(profile);
    if (!dataPath) {
      return sendError(reply, "DataNotFound", "No music data found", id);
    }

    let rows: any[] = [];
    if (dataPath.isDirectory) {
      rows = await readAllCsvs(dataPath.path);
    } else {
      rows = await readCsv(dataPath.path);
    }

    const rowsAll = safeArr<any>(rows);
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
      try { return safeArr(fs.readdirSync(dataPath.path)).filter((f: any) => f.toLowerCase().endsWith(".csv")).length; }
      catch { return 0; }
    })();

    const meta = {
      files,
      rows: rowsAll.length,
      window: { start: firstDateISO(dates), end: lastDateISO(dates) },
      dataPath: dataPath.path,
      dataType: dataPath.type
    };

    reply.send({ profile, playlistRatings, library, meta });
  } catch(err:any){ incError("/api/debug");
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
    const dataPath = getDataPath(profile);
    if (!dataPath) {
      return sendError(reply, "DataNotFound", "No music data found", id);
    }

    let rows: any[] = [];
    if (dataPath.isDirectory) {
      rows = await readAllCsvs(dataPath.path);
    } else {
      rows = await readCsv(dataPath.path);
    }

    const rowsAll = rows; timer.lap("read");
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
  } catch(err:any){ incError("/api/taste-profile");
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
    reply.header("x-snobify-profile", profile);

    const dataPath = getDataPath(profile);
    if (!dataPath) {
      return sendError(reply, "DataNotFound", "No music data found", id);
    }

    const by = await readPlaylistsAsMapLoose(dataPath.path);
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
try {
  await app.listen({ port: PORT, host: "127.0.0.1" });
  console.log(`Snobify server listening on http://127.0.0.1:${PORT}`);
  console.log(`ML Analysis enabled: ${CONFIG.ml?.enabled || false}`);
  console.log(`Data tracking: ${JSON.stringify(CONFIG.ml?.dataTracking || {})}`);
} catch (err) {
  console.error('Server startup failed:', err);
  process.exit(1);
}
