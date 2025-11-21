import { FastifyRequest, FastifyReply } from "fastify";
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
            const rows = await DataService.loadData(profile);
            const dataPath = DataService.getDataPath(profile);

            console.log(`Loaded ${rows.length} tracks from ${dataPath?.type}`);

            const dts = rows
                .map((r: any) => new Date(r?.["Played At"] || r?.["Added At"] || r?.["Release Date"] || ""))
                .filter((d: any) => !isNaN(d.getTime()))
                .sort((a: any, b: any) => a.getTime() - b.getTime());

            const stats = compute(rows);
            timer.lap("compute");

            // plug a stable-ish hash if missing
            if (!stats?.meta?.hash) {
                const firstDateISO = (dates: Date[]) => dates.length ? dates[0].toISOString() : "";
                const lastDateISO = (dates: Date[]) => dates.length ? dates[dates.length - 1].toISOString() : "";
                const h = String(rows.length) + ":" + firstDateISO(dts) + ":" + lastDateISO(dts);
                (stats as any).meta = { ...(stats as any).meta, hash: Buffer.from(h).toString("base64url") };
            }

            reply.header("Server-Timing", timer.header());
            reply.send({ profile, stats });
        } catch (err: any) {
            if (err.message === "DataNotFound") {
                return sendError(reply, "DataNotFound", "No music data found", id, "Place CSV files in Music data/spotify_playlists/ or profiles/<name>/history.csv");
            }
            incError("/api/stats");
            logger.error({ err: String(err), reqId: id }, "stats failed");
            return sendError(reply, "Unknown", err?.message || "Unknown error", id);
        }
    }

    static async getDebug(request: FastifyRequest, reply: FastifyReply) {
        const id = reqId();
        incRequest("/api/debug");
        reply.header("x-req-id", id);

        const q = (request.query as any) || {};
        const profile = String(q.profile || CONFIG.defaultProfile);
        const histOnly = String(q.histOnly ?? "1") !== "0"; // default: history-only
        reply.header("x-snobify-profile", profile);

        try {
            const rowsAll = await DataService.loadData(profile);
            const dataPath = DataService.getDataPath(profile);

            const libraryRows = histOnly
                ? rowsAll.filter((r: any) => String(r?.["Played At"] || "").trim() !== "")
                : rowsAll;

            // Guarded computations
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

            const meta = {
                files: 0, // TODO: fix this if needed, or remove
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
                nichePopularityThreshold: 31,   // Spotify-9 (more niche)
                playWeight: 0.7, uniqueWeight: 0.3,
                recencyBoostMax: 0.10,
                notYouDownweight: 0.5, userAliases: [], // set your username(s) later
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
