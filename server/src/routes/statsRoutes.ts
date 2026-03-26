import { FastifyInstance } from "fastify";
import { StatsController } from "../controllers/statsController.js";
import { ProfilesController } from "../controllers/profilesController.js";

export async function statsRoutes(fastify: FastifyInstance) {
    fastify.get("/api/stats", StatsController.getStats);
    fastify.get("/api/debug", StatsController.getDebug);
    fastify.get("/api/taste-profile", StatsController.getTasteProfile);
    fastify.get("/api/playlist-scores", StatsController.getPlaylistScores);
    fastify.get("/api/profiles", ProfilesController.getProfiles);
}
