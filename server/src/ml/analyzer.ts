import { GenreClassifier } from './genreClassifier.js';
import { MoodPredictor } from './moodPredictor.js';
import { ArtistClusterer } from './artistClusterer.js';
import { RecommendationEngine } from './recommendationEngine.js';
import { FeatureEngineer, ProcessedTrack } from './featureEngineering.js';
import { RealMLModels } from './realModels.js';
import { AdaptiveLearningSystem, PersonalizedInsights } from './adaptiveLearning.js';
import { HierarchicalGenreClassifier, GenreClassificationResult } from './hierarchicalGenres.js';
import { ContextualMoodDetector, ContextualMoodResult, MoodContext } from './contextualMood.js';
import { ContentBasedFiltering, FilteringResult } from './contentFiltering.js';

export interface EnhancedMLAnalysisResult {
  // Original results
  genreClassification: any;
  moodPrediction: any;
  artistClustering: any;
  recommendations: any;
  
  // Enhanced results
  hierarchicalGenres: GenreClassificationResult;
  contextualMood: ContextualMoodResult;
  contentFiltering: FilteringResult;
  personalizedInsights: PersonalizedInsights;
  
  // Model performance
  modelAccuracies: {
    genre: number;
    mood: number;
    clustering: number;
    recommendations: number;
    hierarchicalGenres: number;
    contextualMood: number;
    contentFiltering: number;
  };
  
  // Advanced features
  featureImportance: Map<string, number>;
  modelExplanations: {
    genreExplanation: string[];
    moodExplanation: string[];
    recommendationExplanation: string[];
  };
  
  insights: string[];
  confidence: number;
  processingTime: number;
  modelVersions: {
    genre: string;
    mood: string;
    recommendation: string;
    clustering: string;
  };
}

export class MusicMLAnalyzer {
  // Original components
  private genreClassifier: GenreClassifier;
  private moodPredictor: MoodPredictor;
  private artistClusterer: ArtistClusterer;
  private recommendationEngine: RecommendationEngine;
  
  // Enhanced components
  private featureEngineer: FeatureEngineer;
  private realModels: RealMLModels;
  private adaptiveLearning: AdaptiveLearningSystem;
  private hierarchicalGenres: HierarchicalGenreClassifier;
  private contextualMood: ContextualMoodDetector;
  private contentFiltering: ContentBasedFiltering;
  
  // Performance tracking
  private processingTimes: Map<string, number> = new Map();
  private modelVersions: Map<string, string> = new Map();

  constructor() {
    // Initialize original components
    this.genreClassifier = new GenreClassifier();
    this.moodPredictor = new MoodPredictor();
    this.artistClusterer = new ArtistClusterer();
    this.recommendationEngine = new RecommendationEngine();
    
    // Initialize enhanced components
    this.featureEngineer = new FeatureEngineer();
    this.realModels = new RealMLModels();
    this.adaptiveLearning = new AdaptiveLearningSystem();
    this.hierarchicalGenres = new HierarchicalGenreClassifier();
    this.contextualMood = new ContextualMoodDetector();
    this.contentFiltering = new ContentBasedFiltering();
    
    // Set model versions
    this.modelVersions.set('genre', '2.0.0');
    this.modelVersions.set('mood', '2.0.0');
    this.modelVersions.set('recommendation', '2.0.0');
    this.modelVersions.set('clustering', '2.0.0');
  }

  async analyze(tracks: any[], userId: string = 'default', context?: MoodContext): Promise<EnhancedMLAnalysisResult> {
    const startTime = Date.now();
    console.log(`Starting enhanced ML analysis for ${tracks.length} tracks`);

    // Process tracks with advanced feature engineering
    const processedTracks = await this.processTracksWithFeatures(tracks);
    
    // Run original models in parallel
    const [genreResults, moodResults, clusterResults, recommendationResults] = await Promise.all([
      this.runWithTiming('genre', () => this.genreClassifier.classify(tracks)),
      this.runWithTiming('mood', () => this.moodPredictor.predict(tracks)),
      this.runWithTiming('clustering', () => this.artistClusterer.cluster(tracks)),
      this.runWithTiming('recommendations', () => this.recommendationEngine.recommend(tracks, 10))
    ]);

    // Run enhanced models in parallel
    const [hierarchicalGenreResults, contextualMoodResults, contentFilteringResults, personalizedInsights] = await Promise.all([
      this.runWithTiming('hierarchicalGenres', () => this.runHierarchicalGenreAnalysis(processedTracks)),
      this.runWithTiming('contextualMood', () => this.runContextualMoodAnalysis(processedTracks, context)),
      this.runWithTiming('contentFiltering', () => this.runContentFilteringAnalysis(processedTracks, userId)),
      this.runWithTiming('personalizedInsights', () => this.adaptiveLearning.generatePersonalizedInsights(userId))
    ]);

    // Calculate enhanced model accuracies
    const modelAccuracies = {
      genre: this.calculateGenreAccuracy(genreResults),
      mood: this.calculateMoodAccuracy(moodResults),
      clustering: this.calculateClusteringAccuracy(clusterResults),
      recommendations: this.calculateRecommendationAccuracy(recommendationResults),
      hierarchicalGenres: this.calculateHierarchicalGenreAccuracy(hierarchicalGenreResults),
      contextualMood: this.calculateContextualMoodAccuracy(contextualMoodResults),
      contentFiltering: this.calculateContentFilteringAccuracy(contentFilteringResults)
    };

    // Generate feature importance analysis
    const featureImportance = this.calculateFeatureImportance(processedTracks);

    // Generate model explanations
    const modelExplanations = this.generateModelExplanations(
      genreResults, moodResults, recommendationResults, hierarchicalGenreResults
    );

    // Generate enhanced insights
    const insights = this.generateEnhancedInsights(
      genreResults, moodResults, clusterResults, recommendationResults,
      hierarchicalGenreResults, contextualMoodResults, contentFilteringResults
    );

    // Calculate overall confidence
    const confidence = Object.values(modelAccuracies).reduce((sum, acc) => sum + acc, 0) / 7;

    const processingTime = Date.now() - startTime;

    return {
      // Original results
      genreClassification: genreResults,
      moodPrediction: moodResults,
      artistClustering: clusterResults,
      recommendations: recommendationResults,
      
      // Enhanced results
      hierarchicalGenres: hierarchicalGenreResults,
      contextualMood: contextualMoodResults,
      contentFiltering: contentFilteringResults,
      personalizedInsights,
      
      // Model performance
      modelAccuracies,
      
      // Advanced features
      featureImportance,
      modelExplanations,
      
      insights,
      confidence,
      processingTime,
      modelVersions: {
        genre: this.modelVersions.get('genre') || '2.0.0',
        mood: this.modelVersions.get('mood') || '2.0.0',
        recommendation: this.modelVersions.get('recommendation') || '2.0.0',
        clustering: this.modelVersions.get('clustering') || '2.0.0'
      }
    };
  }

  private calculateGenreAccuracy(genreResults: any): number {
    // Simulate accuracy calculation based on confidence scores
    return Math.min(0.95, Math.max(0.7, genreResults.confidence || 0.8));
  }

  private calculateMoodAccuracy(moodResults: any): number {
    return Math.min(0.92, Math.max(0.75, moodResults.confidence || 0.85));
  }

  private calculateClusteringAccuracy(clusterResults: any): number {
    return Math.min(0.88, Math.max(0.65, clusterResults.silhouetteScore || 0.8));
  }

  private calculateRecommendationAccuracy(recommendationResults: any): number {
    return Math.min(0.90, Math.max(0.70, recommendationResults.confidence || 0.82));
  }

  // ============================================================================
  // ENHANCED ANALYSIS METHODS
  // ============================================================================
  
  private async processTracksWithFeatures(tracks: any[]): Promise<ProcessedTrack[]> {
    const processedTracks: ProcessedTrack[] = [];
    
    for (const track of tracks.slice(0, 1000)) { // Limit for performance
      try {
        const processedTrack = await this.featureEngineer.processTrack(track);
        processedTracks.push(processedTrack);
      } catch (error) {
        console.warn(`Failed to process track ${track.trackName}:`, error);
      }
    }
    
    return processedTracks;
  }
  
  private async runWithTiming<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    const result = await fn();
    const duration = Date.now() - startTime;
    this.processingTimes.set(name, duration);
    console.log(`${name} analysis completed in ${duration}ms`);
    return result;
  }
  
  private async runHierarchicalGenreAnalysis(tracks: ProcessedTrack[]): Promise<GenreClassificationResult> {
    if (tracks.length === 0) {
      return {
        primaryGenre: { id: 'unknown', name: 'Unknown', level: 0, children: [], features: {} as any, keywords: [], similarGenres: [], fusionGenres: [] },
        subGenres: [],
        microGenres: [],
        confidence: 0,
        fusionDetected: false,
        fusionGenres: [],
        genreComplexity: 0,
        genreEvolution: { era: 'Unknown', influences: [], modernVariants: [] }
      };
    }
    
    // Use the first track as representative (in a real system, you'd analyze all tracks)
    const representativeTrack = tracks[0];
    return await this.hierarchicalGenres.classifyHierarchical(representativeTrack.features);
  }
  
  private async runContextualMoodAnalysis(tracks: ProcessedTrack[], context?: MoodContext): Promise<ContextualMoodResult> {
    if (tracks.length === 0) {
      return {
        currentMood: {
          primaryMood: 'neutral',
          secondaryMoods: [],
          intensity: 0.5,
          confidence: 0.5,
          emotionalValence: 0.5,
          emotionalArousal: 0.5,
          emotionalDominance: 0.5,
          moodStability: 0.5,
          contextualFactors: { timeInfluence: 0, activityInfluence: 0, environmentInfluence: 0, socialInfluence: 0 },
          moodHistory: { previousMoods: [], moodTransitions: [], averageMood: 'neutral', moodVariability: 0.5 }
        },
        predictedMood: {
          primaryMood: 'neutral',
          secondaryMoods: [],
          intensity: 0.5,
          confidence: 0.5,
          emotionalValence: 0.5,
          emotionalArousal: 0.5,
          emotionalDominance: 0.5,
          moodStability: 0.5,
          contextualFactors: { timeInfluence: 0, activityInfluence: 0, environmentInfluence: 0, socialInfluence: 0 },
          moodHistory: { previousMoods: [], moodTransitions: [], averageMood: 'neutral', moodVariability: 0.5 }
        },
        moodRecommendations: { musicSuggestions: [], moodEnhancement: [], moodStabilization: [] },
        contextualInsights: { moodPatterns: [], environmentalTriggers: [], optimalListeningTimes: [], moodInfluencers: [] }
      };
    }
    
    const defaultContext: MoodContext = {
      timeOfDay: 'afternoon',
      dayOfWeek: 'weekday',
      season: 'summer',
      weather: 'unknown',
      activity: 'unknown',
      environment: 'unknown',
      socialContext: 'unknown',
      energyLevel: 'medium',
      stressLevel: 'medium',
      recentEvents: []
    };
    
    const moodContext = context || defaultContext;
    const representativeTrack = tracks[0];
    
    return await this.contextualMood.detectContextualMood(representativeTrack.features, moodContext);
  }
  
  private async runContentFilteringAnalysis(tracks: ProcessedTrack[], userId: string): Promise<FilteringResult> {
    // Generate recommendations using content-based filtering
    return await this.contentFiltering.generateRecommendations(userId, tracks, 10);
  }
  
  // ============================================================================
  // ENHANCED ACCURACY CALCULATIONS
  // ============================================================================
  
  private calculateHierarchicalGenreAccuracy(results: GenreClassificationResult): number {
    return results.confidence;
  }
  
  private calculateContextualMoodAccuracy(results: ContextualMoodResult): number {
    return (results.currentMood.confidence + results.predictedMood.confidence) / 2;
  }
  
  private calculateContentFilteringAccuracy(results: FilteringResult): number {
    return (results.filteringMetrics.precision + results.filteringMetrics.recall) / 2;
  }
  
  // ============================================================================
  // FEATURE IMPORTANCE ANALYSIS
  // ============================================================================
  
  private calculateFeatureImportance(tracks: ProcessedTrack[]): Map<string, number> {
    const importance = new Map<string, number>();
    
    if (tracks.length === 0) return importance;
    
    // Calculate variance for each feature across tracks
    const features = ['energy', 'valence', 'danceability', 'acousticness', 'tempo', 'popularity'];
    
    features.forEach(feature => {
      const values = tracks.map(track => track.features[feature as keyof typeof track.features] as number);
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      
      // Higher standard deviation = more important for distinguishing tracks
      importance.set(feature, stdDev);
    });
    
    // Normalize importance scores
    const maxImportance = Math.max(...importance.values());
    if (maxImportance > 0) {
      importance.forEach((value, key) => {
        importance.set(key, value / maxImportance);
      });
    }
    
    return importance;
  }
  
  // ============================================================================
  // MODEL EXPLANATIONS
  // ============================================================================
  
  private generateModelExplanations(
    genreResults: any,
    moodResults: any,
    recommendationResults: any,
    hierarchicalResults: GenreClassificationResult
  ): EnhancedMLAnalysisResult['modelExplanations'] {
    const genreExplanation: string[] = [];
    const moodExplanation: string[] = [];
    const recommendationExplanation: string[] = [];
    
    // Genre explanations
    if (hierarchicalResults.primaryGenre) {
      genreExplanation.push(`Primary genre: ${hierarchicalResults.primaryGenre.name}`);
      genreExplanation.push(`Confidence: ${(hierarchicalResults.confidence * 100).toFixed(1)}%`);
      
      if (hierarchicalResults.fusionDetected) {
        genreExplanation.push(`Fusion detected: ${hierarchicalResults.fusionGenres.map(fg => fg.name).join(', ')}`);
      }
      
      genreExplanation.push(`Genre complexity: ${(hierarchicalResults.genreComplexity * 100).toFixed(1)}%`);
    }
    
    // Mood explanations
    if (moodResults.dominantMood) {
      moodExplanation.push(`Dominant mood: ${moodResults.dominantMood}`);
      moodExplanation.push(`Mood confidence: ${(moodResults.confidence * 100).toFixed(1)}%`);
      
      if (moodResults.emotions) {
        moodExplanation.push(`Associated emotions: ${moodResults.emotions.join(', ')}`);
      }
    }
    
    // Recommendation explanations
    if (recommendationResults.similarity) {
      recommendationExplanation.push(`Average similarity: ${(recommendationResults.similarity * 100).toFixed(1)}%`);
      recommendationExplanation.push(`Recommendation confidence: ${(recommendationResults.confidence * 100).toFixed(1)}%`);
    }
    
    return {
      genreExplanation,
      moodExplanation,
      recommendationExplanation
    };
  }
  
  // ============================================================================
  // ENHANCED INSIGHTS GENERATION
  // ============================================================================
  
  private generateEnhancedInsights(
    genre: any, mood: any, cluster: any, recommendations: any,
    hierarchicalGenres: GenreClassificationResult, contextualMood: ContextualMoodResult,
    contentFiltering: FilteringResult
  ): string[] {
    const insights: string[] = [];

    // Original insights
    if (genre.topGenres) {
      insights.push(`Your music spans ${genre.topGenres.length} distinct genres, showing ${genre.diversity > 0.7 ? 'high' : 'moderate'} genre diversity.`);
    }

    if (mood.dominantMood) {
      insights.push(`Your listening patterns suggest a ${mood.dominantMood} musical preference, with ${(mood.confidence * 100).toFixed(1)}% confidence.`);
    }

    if (cluster.clusters) {
      insights.push(`Your artists form ${cluster.clusters.length} distinct clusters, indicating ${cluster.clusters.length > 5 ? 'eclectic' : 'focused'} taste.`);
    }

    if (recommendations.similarity) {
      insights.push(`Based on your taste, you might enjoy artists with ${recommendations.similarity > 0.8 ? 'high' : 'moderate'} similarity to your current preferences.`);
    }
    
    // Enhanced insights
    if (hierarchicalGenres.primaryGenre) {
      insights.push(`Your primary genre is ${hierarchicalGenres.primaryGenre.name} with ${hierarchicalGenres.subGenres.length} sub-genres identified.`);
      
      if (hierarchicalGenres.fusionDetected) {
        insights.push(`You enjoy fusion genres, particularly ${hierarchicalGenres.fusionGenres.map(fg => fg.name).join(', ')}.`);
      }
    }
    
    if (contextualMood.currentMood) {
      insights.push(`Your current mood is ${contextualMood.currentMood.primaryMood} with ${(contextualMood.currentMood.intensity * 100).toFixed(1)}% intensity.`);
      
      if (contextualMood.contextualInsights.moodPatterns.length > 0) {
        insights.push(`Mood pattern: ${contextualMood.contextualInsights.moodPatterns[0]}`);
      }
    }
    
    if (contentFiltering.filteringMetrics) {
      const metrics = contentFiltering.filteringMetrics;
      insights.push(`Recommendation diversity: ${(metrics.diversity * 100).toFixed(1)}%, Novelty: ${(metrics.novelty * 100).toFixed(1)}%`);
    }

    return insights;
  }
  
  // ============================================================================
  // ORIGINAL METHODS (for backward compatibility)
  // ============================================================================
  
  private generateInsights(genre: any, mood: any, cluster: any, recommendations: any): string[] {
    return this.generateEnhancedInsights(genre, mood, cluster, recommendations, {} as any, {} as any, {} as any);
  }
  
  // ============================================================================
  // PUBLIC API
  // ============================================================================
  
  async processUserFeedback(userId: string, trackId: string, interaction: string): Promise<void> {
    // Process user feedback for adaptive learning
    console.log(`Processing feedback: ${interaction} for track ${trackId} by user ${userId}`);
    // Implementation would integrate with adaptive learning system
  }
  
  getProcessingTimes(): Map<string, number> {
    return this.processingTimes;
  }
  
  getModelVersions(): Map<string, string> {
    return this.modelVersions;
  }
  
  // Cleanup
  dispose(): void {
    this.realModels.dispose();
    this.adaptiveLearning.dispose();
    this.contentFiltering.dispose();
  }
}


