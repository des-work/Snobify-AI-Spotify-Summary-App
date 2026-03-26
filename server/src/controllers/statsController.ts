import { FastifyRequest, FastifyReply } from "fastify";
import fs from "fs";
import { DataService } from "../services/dataService.js";
import { CONFIG } from "../config/index.js";
import { logger } from "../observability/logger.js";
import { incRequest, incError, Timer } from "../observability/metrics.js";
import { sendError } from "../errors/respond.js";
import { compute } from "../compute/compute.js";
import { analyzeLibrary } from "../compute/libraryAnalysis.js";
import { buildTasteProfile } from "../compute/tasteProfile.js";
import { computePlaylistRatings } from "../compute/playlistRatings.js";
import { scoreOnePlaylist, rareEligibilityFromPlaylists } from "../compute/playlistScore.js";
import { readPlaylistsAsMapLoose } from "../ingest/readAll.js";

const reqId = () => Math.random().toString(36).slice(2, 9);

// ── In-process stats cache ────────────────────────────────────────────────────
// Key = "profile:fingerprint" where fingerprint = mtime+size of all CSV files.
// A new upload changes mtime, instantly busting the cache without needing a TTL.
interface CacheEntry { stats: any; fingerprint: string; cachedAt: number }
const statsCache = new Map<string, CacheEntry>();
const CACHE_MAX_AGE_MS = 10 * 60 * 1000; // safety ceiling: 10 minutes

function fingerprint(dataPath: { isDirectory: boolean; path: string }): string {
    try {
        if (dataPath.isDirectory) {
            const files = fs.readdirSync(dataPath.path).filter(f => f.toLowerCase().endsWith(".csv")).sort();
            return files.map(f => {
                const s = fs.statSync(`${dataPath.path}/${f}`);
                return `${f}:${s.mtimeMs}:${s.size}`;
            }).join("|");
        }
        const s = fs.statSync(dataPath.path);
        return `${s.mtimeMs}:${s.size}`;
    } catch {
        return String(Date.now()); // on error, don't cache
    }
}

function getCachedStats(profile: string, fp: string): any | null {
    const entry = statsCache.get(profile);
    if (!entry) return null;
    if (entry.fingerprint !== fp) { statsCache.delete(profile); return null; }
    if (Date.now() - entry.cachedAt > CACHE_MAX_AGE_MS) { statsCache.delete(profile); return null; }
    return entry.stats;
}

function setCachedStats(profile: string, fp: string, stats: any): void {
    statsCache.set(profile, { stats, fingerprint: fp, cachedAt: Date.now() });
}

function countCsvFiles(dirPath: string): number {
    try {
        return fs.readdirSync(dirPath).filter(f => f.toLowerCase().endsWith(".csv")).length;
    } catch {
        return 1;
    }
}

export class StatsController {
    static async getStats(request: FastifyRequest, reply: FastifyReply) {
        const id = reqId();
        incRequest("/api/stats");
        const timer = new Timer();
        reply.header("x-req-id", id);

        const q = (request.query as any) || {};
        const profile = String(q.profile || CONFIG.defaultProfile);
        reply.header("x-snobify-profile", profile);

        try {
            const dataPath = DataService.getDataPath(profile);
            if (!dataPath) {
                return sendError(reply, "DataNotFound", "No music data found", id,
                    "Place CSV files in Music data/spotify_playlists/ or profiles/<name>/history.csv");
            }

            // ── Cache check ──────────────────────────────────────────────────
            const fp = fingerprint(dataPath);
            const cached = getCachedStats(profile, fp);
            if (cached) {
                timer.lap("cache-hit");
                reply.header("x-snobify-cache", "HIT");
                reply.header("Server-Timing", timer.header());
                reply.send({ profile, stats: cached });
                return;
            }
            reply.header("x-snobify-cache", "MISS");

            const rows = await DataService.loadData(profile);

            console.log(`Loaded ${rows.length} tracks from ${dataPath.type}`);

            if (rows.length === 0) {
                return sendError(reply, "CsvSchemaInvalid", "CSV was loaded but contained 0 valid rows", id,
                    "Make sure your CSV has a 'Track URI' column. Spotify extended history format may need conversion.");
            }

            const dts = rows
                .map((r: any) => new Date(r?.["Played At"] || r?.["Added At"] || r?.["Release Date"] || ""))
                .filter((d: any) => !isNaN(d.getTime()))
                .sort((a: any, b: any) => a.getTime() - b.getTime());

            const fileCount = dataPath.isDirectory ? countCsvFiles(dataPath.path) : 1;

            const stats = compute(rows);
            stats.meta.files = fileCount;
            timer.lap("compute");

            // plug a stable hash if missing
            if (!stats?.meta?.hash) {
                const firstDateISO = (dates: Date[]) => dates.length ? dates[0].toISOString() : "";
                const lastDateISO  = (dates: Date[]) => dates.length ? dates[dates.length - 1].toISOString() : "";
                const h = String(rows.length) + ":" + firstDateISO(dts) + ":" + lastDateISO(dts);
                (stats as any).meta = { ...(stats as any).meta, hash: Buffer.from(h).toString("base64url") };
            }

            setCachedStats(profile, fp, stats);

            reply.header("Server-Timing", timer.header());
            reply.send({ profile, stats });
        } catch (err: any) {
            if (err.message === "DataNotFound") {
                return sendError(reply, "DataNotFound", "No music data found", id,
                    "Place CSV files in Music data/spotify_playlists/ or profiles/<name>/history.csv");
            }
            incError("/api/stats");
            const msg = err?.message || String(err);
            console.error(`[stats] profile=${profile} error:`, msg);
            logger.error({ err: msg, reqId: id }, "stats failed");
            return sendError(reply, "Unknown", msg, id,
                msg.includes("required column") ? "Your CSV may be in the wrong format. Snobify needs Spotify playlist export CSVs with a 'Track URI' column." : undefined);
        }
    }

    static async getDebug(request: FastifyRequest, reply: FastifyReply) {
        const id = reqId();
        incRequest("/api/debug");
        reply.header("x-req-id", id);

        const q = (request.query as any) || {};
        const profile = String(q.profile || CONFIG.defaultProfile);
        const histOnly = String(q.histOnly ?? "1") !== "0";
        reply.header("x-snobify-profile", profile);

        try {
            const rowsAll = await DataService.loadData(profile);
            const dataPath = DataService.getDataPath(profile);

            const libraryRows = histOnly
                ? rowsAll.filter((r: any) => String(r?.["Played At"] || "").trim() !== "")
                : rowsAll;

            let playlistRatings: any[] = [];
            try { playlistRatings = computePlaylistRatings(rowsAll); }
            catch (e) { logger.error({ err: String(e), where: "computePlaylistRatings", reqId: id }); playlistRatings = []; }

            let library: any = { timeDepth: {}, vintageGenresTop: [], topGenresAll: [], topGenresModern: [], genreContrast: 0, favoritesPerGenre: [] };
            try { library = analyzeLibrary(libraryRows); }
            catch (e) { logger.error({ err: String(e), where: "analyzeLibrary", reqId: id }); }

            const dates = libraryRows
                .map((r: any) => new Date(r?.["Played At"] || r?.["Added At"] || r?.["Release Date"] || ""))
                .filter((d: any) => !isNaN(d.getTime()))
                .sort((a: any, b: any) => a.getTime() - b.getTime());

            const fileCount = dataPath?.isDirectory ? countCsvFiles(dataPath.path) : 1;

            const meta = {
                files: fileCount,
                rows: rowsAll.length,
                window: {
                    start: dates.length ? dates[0].toISOString() : "",
                    end: dates.length ? dates[dates.length - 1].toISOString() : ""
                },
                dataPath: dataPath?.path,
                dataType: dataPath?.type
            };

            reply.send({ profile, playlistRatings, library, meta });
        } catch (err: any) {
            if (err.message === "DataNotFound") {
                return sendError(reply, "DataNotFound", "No music data found", id);
            }
            incError("/api/debug");
            logger.error({ err: String(err), reqId: id }, "ratings failed");
            return sendError(reply, "Unknown", err?.message || "Unknown error", id);
        }
    }

    static async getTasteProfile(request: FastifyRequest, reply: FastifyReply) {
        const id = reqId();
        incRequest("/api/taste-profile");
        const timer = new Timer();
        reply.header("x-req-id", id);

        const q = (request.query as any) || {};
        const profile = String(q.profile || CONFIG.defaultProfile);
        reply.header("x-snobify-profile", profile);

        try {
            const rowsAll = await DataService.loadData(profile);
            timer.lap("read");

            const tp = buildTasteProfile(Array.isArray(rowsAll) ? rowsAll : [], {
                nichePopularityThreshold: 31,
                playWeight: 0.7, uniqueWeight: 0.3,
                recencyBoostMax: 0.10,
                notYouDownweight: 0.5, userAliases: [],
                playlistWeightCapPct: 35,
                minRows: 300
            });

            const dates = (Array.isArray(rowsAll) ? rowsAll : [])
                .map((r: any) => new Date((r as any)?.["Played At"] || (r as any)?.["Added At"] || (r as any)?.["Release Date"] || ""))
                .filter((d: any) => !isNaN(d.getTime()))
                .sort((a: any, b: any) => a.getTime() - b.getTime());

            reply.send({
                profile, taste: tp, meta: {
                    rows: Array.isArray(rowsAll) ? rowsAll.length : 0,
                    window: { start: dates.length ? dates[0].toISOString() : "", end: dates.length ? dates[dates.length - 1].toISOString() : "" }
                }
            });
        } catch (err: any) {
            if (err.message === "DataNotFound") {
                return sendError(reply, "DataNotFound", "No music data found", id);
            }
            incError("/api/taste-profile");
            logger.error({ err: String(err), reqId: id }, "taste-profile failed");
            return sendError(reply, "Unknown", err?.message || "Unknown error", id);
        }
    }

    static async getPlaylistScores(request: FastifyRequest, reply: FastifyReply) {
        const id = reqId();
        incRequest("/api/playlist-scores");
        const timer = new Timer();
        reply.header("x-req-id", id);

        try {
            const q = (request.query as any) || {};
            const profile = String(q.profile || CONFIG.defaultProfile);
            reply.header("x-snobify-profile", profile);

            const dataPath = DataService.getDataPath(profile);
            if (!dataPath) {
                return sendError(reply, "DataNotFound", "No music data found", id);
            }

            const by = await readPlaylistsAsMapLoose(dataPath.path);
            const scores = [...by.entries()].map(([name, rows]) => scoreOnePlaylist(name, rows));
            scores.sort((a, b) => b.score - a.score);

            const rare = rareEligibilityFromPlaylists(scores);

            reply.header("server-timing", timer.total("playlist-scores"));
            reply.send({ profile, rare, scores, meta: { playlists: scores.length } });
        } catch (err: any) {
            incError("/api/playlist-scores");
            logger?.error?.({ err: String(err), reqId: id }, "playlist-scores failed");
            return sendError(reply, "Unknown", err?.message || "Unknown error", id);
        }
    }
}
