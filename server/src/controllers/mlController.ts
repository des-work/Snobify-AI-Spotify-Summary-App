import { FastifyRequest, FastifyReply } from "fastify";
import { DataService } from "../services/dataService.js";
import { mlService } from "../services/mlService.js";
import { CONFIG } from "../config/index.js";
import { logger } from "../observability/logger.js";
import { incRequest, incError, Timer } from "../observability/metrics.js";
import { sendError } from "../errors/respond.js";

const reqId = () => Math.random().toString(36).slice(2, 9);

export class MLController {
    static async getMoodPrediction(request: FastifyRequest, reply: FastifyReply) {
        const id = reqId();
        incRequest("/api/mood-prediction");
        const timer = new Timer();
        reply.header("x-req-id", id);

        const q = (request.query as any) || {};
        const profile = String(q.profile || CONFIG.defaultProfile);
        reply.header("x-snobify-profile", profile);

        try {
            const rows = await DataService.loadData(profile);
            const moodResults = await mlService.moodPredictor.predict(rows);

            reply.header("Server-Timing", timer.header());
            reply.send({ profile, moodResults });
        } catch (err: any) {
            if (err.message === "DataNotFound") {
                return sendError(reply, "DataNotFound", "No music data found", id);
            }
            incError("/api/mood-prediction");
            logger.error({ err: String(err), reqId: id }, "Mood prediction failed");
            return sendError(reply, "Unknown", err?.message || "Unknown error", id);
        }
    }

    static async trainMoodModel(request: FastifyRequest, reply: FastifyReply) {
        const id = reqId();
        incRequest("/api/mood-training");
        const timer = new Timer();
        reply.header("x-req-id", id);

        const q = (request.query as any) || {};
        const profile = String(q.profile || CONFIG.defaultProfile);
        reply.header("x-snobify-profile", profile);

        try {
            const rows = await DataService.loadData(profile);

            // Build training samples from the CSV column names (capitalised, as per RowSchema)
            const trainingData = rows.slice(0, 100).map((track: any) => {
                const valence      = Number(track["Valence"]      ?? 0);
                const energy       = Number(track["Energy"]       ?? 0);
                const danceability = Number(track["Danceability"] ?? 0);
                const acousticness = Number(track["Acousticness"] ?? 0);
                const tempo        = Number(track["Tempo"]        ?? 120);

                let mood = "Happy";
                if (valence < 0.3)                         mood = "Sad";
                else if (valence > 0.7 && energy > 0.7)   mood = "Excited";
                else if (energy > 0.6)                     mood = "Energetic";
                else if (energy < 0.3)                     mood = "Calm";

                return { features: { valence, energy, danceability, acousticness, tempo }, mood, confidence: 0.8 };
            });

            await mlService.moodPredictor.trainModel(trainingData);

            reply.header("Server-Timing", timer.header());
            reply.send({
                profile,
                trainingSamples: trainingData.length,
                modelTrained: true,
                message: "Mood prediction model trained successfully",
            });
        } catch (err: any) {
            if (err.message === "DataNotFound") {
                return sendError(reply, "DataNotFound", "No music data found", id);
            }
            incError("/api/mood-training");
            logger.error({ err: String(err), reqId: id }, "Mood training failed");
            return sendError(reply, "Unknown", err?.message || "Unknown error", id);
        }
    }
}
