import { MusicMLAnalyzer } from "../ml/analyzer.js";
import { GenreClassifier } from "../ml/genreClassifier.js";
import { MoodPredictor } from "../ml/moodPredictor.js";
import { ArtistClusterer } from "../ml/artistClusterer.js";
import { RecommendationEngine } from "../ml/recommendationEngine.js";

export class MLService {
    private static instance: MLService;

    public analyzer: MusicMLAnalyzer;
    public genreClassifier: GenreClassifier;
    public moodPredictor: MoodPredictor;
    public artistClusterer: ArtistClusterer;
    public recommendationEngine: RecommendationEngine;

    private constructor() {
        this.analyzer = new MusicMLAnalyzer();
        this.genreClassifier = new GenreClassifier();
        this.moodPredictor = new MoodPredictor();
        this.artistClusterer = new ArtistClusterer();
        this.recommendationEngine = new RecommendationEngine();
    }

    public static getInstance(): MLService {
        if (!MLService.instance) {
            MLService.instance = new MLService();
        }
        return MLService.instance;
    }
}

export const mlService = MLService.getInstance();
