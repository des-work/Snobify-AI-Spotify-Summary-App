import { MoodPredictor } from "../ml/moodPredictor.js";

/**
 * MLService — only real, working ML is wired here.
 * Stubs (genreClassifier, artistClusterer, recommendationEngine, etc.) have been removed.
 * Add new capabilities here only when they are genuinely implemented.
 */
export class MLService {
    private static instance: MLService;

    public moodPredictor: MoodPredictor;

    private constructor() {
        this.moodPredictor = new MoodPredictor();
    }

    public static getInstance(): MLService {
        if (!MLService.instance) {
            MLService.instance = new MLService();
        }
        return MLService.instance;
    }
}

export const mlService = MLService.getInstance();
