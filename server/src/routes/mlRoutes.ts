import { FastifyInstance } from "fastify";
import { MLController } from "../controllers/mlController.js";

export async function mlRoutes(fastify: FastifyInstance) {
    fastify.get("/api/mood-prediction", MLController.getMoodPrediction);
    fastify.post("/api/mood-training",  MLController.trainMoodModel);
}
