import { FastifyInstance } from "fastify";
import { MLController } from "../controllers/mlController.js";

export async function mlRoutes(fastify: FastifyInstance) {
    fastify.get("/api/ml-analysis", MLController.getAnalysis);
    fastify.get("/api/genre-classification", MLController.getGenreClassification);
    fastify.get("/api/mood-prediction", MLController.getMoodPrediction);
    fastify.post("/api/mood-training", MLController.trainMoodModel);
    fastify.get("/api/artist-clustering", MLController.getArtistClustering);
    fastify.get("/api/recommendations", MLController.getRecommendations);
}
