import { FastifyRequest, FastifyReply } from "fastify";
import { DataService } from "../services/dataService.js";
import { mlService } from "../services/mlService.js";
import { CONFIG } from "../config/index.js";
import { logger } from "../observability/logger.js";
import { incRequest, incError, Timer } from "../observability/metrics.js";
import { sendError } from "../errors/respond.js";

const reqId = () => Math.random().toString(36).slice(2, 9);

export class MLController {
    static async getAnalysis(request: FastifyRequest, reply: FastifyReply) {
        const id = reqId();
        incRequest("/api/ml-analysis");
        const timer = new Timer();
        reply.header("x-req-id", id);

        const q = (request.query as any) || {};
        const profile = String(q.profile || CONFIG.defaultProfile);
        reply.header("x-snobify-profile", profile);

        try {
            const rows = await DataService.loadData(profile);

            // Run ML analysis
            const mlResults = await mlService.analyzer.analyze(rows);

            reply.header("Server-Timing", timer.header());
            reply.send({
                profile,
                mlResults,
                dataTracking: CONFIG.ml?.dataTracking || {}
            });
        } catch (err: any) {
            if (err.message === "DataNotFound") {
                return sendError(reply, "DataNotFound", "No music data found", id);
            }
            incError("/api/ml-analysis");
            logger.error({ err: String(err), reqId: id }, "ML analysis failed");
            return sendError(reply, "Unknown", err?.message || "Unknown error", id);
        }
    }

    static async getGenreClassification(request: FastifyRequest, reply: FastifyReply) {
        const id = reqId();
        incRequest("/api/genre-classification");
        const timer = new Timer();
        reply.header("x-req-id", id);

        const q = (request.query as any) || {};
        const profile = String(q.profile || CONFIG.defaultProfile);
        reply.header("x-snobify-profile", profile);

        try {
            const rows = await DataService.loadData(profile);

            // Run genre classification
            const genreResults = await mlService.genreClassifier.classify(rows);

            reply.header("Server-Timing", timer.header());
            reply.send({ profile, genreResults });
        } catch (err: any) {
            if (err.message === "DataNotFound") {
                return sendError(reply, "DataNotFound", "No music data found", id);
            }
            incError("/api/genre-classification");
            logger.error({ err: String(err), reqId: id }, "Genre classification failed");
            return sendError(reply, "Unknown", err?.message || "Unknown error", id);
        }
    }

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

            // Run mood prediction
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
            await mlService.moodPredictor.trainModel(trainingData);

            reply.header("Server-Timing", timer.header());
            reply.send({
                profile,
                trainingSamples: trainingData.length,
                modelTrained: true,
                message: "Mood prediction model trained successfully"
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

    static async getArtistClustering(request: FastifyRequest, reply: FastifyReply) {
        const id = reqId();
        incRequest("/api/artist-clustering");
        const timer = new Timer();
        reply.header("x-req-id", id);

        const q = (request.query as any) || {};
        const profile = String(q.profile || CONFIG.defaultProfile);
        reply.header("x-snobify-profile", profile);

        try {
            const rows = await DataService.loadData(profile);

            // Run artist clustering
            const clusterResults = await mlService.artistClusterer.cluster(rows);

            reply.header("Server-Timing", timer.header());
            reply.send({ profile, clusterResults });
        } catch (err: any) {
            if (err.message === "DataNotFound") {
                return sendError(reply, "DataNotFound", "No music data found", id);
            }
            incError("/api/artist-clustering");
            logger.error({ err: String(err), reqId: id }, "Artist clustering failed");
            return sendError(reply, "Unknown", err?.message || "Unknown error", id);
        }
    }

    static async getRecommendations(request: FastifyRequest, reply: FastifyReply) {
        const id = reqId();
        incRequest("/api/recommendations");
        const timer = new Timer();
        reply.header("x-req-id", id);

        const q = (request.query as any) || {};
        const profile = String(q.profile || CONFIG.defaultProfile);
        const limit = parseInt(q.limit || "10");
        reply.header("x-snobify-profile", profile);

        try {
            const rows = await DataService.loadData(profile);

            // Generate recommendations
            const recommendations = await mlService.recommendationEngine.recommend(rows, limit);

            reply.header("Server-Timing", timer.header());
            reply.send({ profile, recommendations });
        } catch (err: any) {
            if (err.message === "DataNotFound") {
                return sendError(reply, "DataNotFound", "No music data found", id);
            }
            incError("/api/recommendations");
            logger.error({ err: String(err), reqId: id }, "Recommendations failed");
            return sendError(reply, "Unknown", err?.message || "Unknown error", id);
        }
    }
}
