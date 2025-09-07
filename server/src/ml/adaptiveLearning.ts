// ============================================================================
// ADAPTIVE LEARNING SYSTEM - LEARNS FROM USER FEEDBACK
// ============================================================================

import { RealMLModels, TrainingData } from './realModels.js';
import { FeatureEngineer, ProcessedTrack } from './featureEngineering.js';

export interface UserFeedback {
  trackId: string;
  action: 'like' | 'dislike' | 'skip' | 'repeat' | 'share' | 'save';
  timestamp: Date;
  context?: {
    mood: string;
    activity: string;
    environment: string;
  };
  explicitRating?: number; // 1-5 scale
}

export interface LearningSession {
  sessionId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  tracks: ProcessedTrack[];
  feedback: UserFeedback[];
  context: {
    timeOfDay: number;
    dayOfWeek: number;
    season: number;
    listeningDuration: number;
  };
}

export interface ModelPerformance {
  modelName: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  lastUpdated: Date;
  trainingSamples: number;
  confidence: number;
}

export interface PersonalizedInsights {
  userPreferences: {
    favoriteGenres: string[];
    favoriteMoods: string[];
    favoriteArtists: string[];
    listeningPatterns: string[];
  };
  recommendations: {
    nextTracks: string[];
    similarArtists: string[];
    genreExplorations: string[];
    moodSuggestions: string[];
  };
  insights: {
    discoveryRate: number;
    diversityScore: number;
    trendAnalysis: string[];
    personalityTraits: string[];
  };
}

export class AdaptiveLearningSystem {
  private models: RealMLModels;
  private featureEngineer: FeatureEngineer;
  private feedbackHistory: UserFeedback[] = [];
  private learningSessions: LearningSession[] = [];
  private modelPerformance: Map<string, ModelPerformance> = new Map();
  private userProfiles: Map<string, PersonalizedInsights> = new Map();
  
  // Learning parameters
  private learningRate: number = 0.01;
  private minSamplesForRetrain: number = 100;
  private retrainInterval: number = 24 * 60 * 60 * 1000; // 24 hours
  private lastRetrainTime: Date = new Date();
  
  constructor() {
    this.models = new RealMLModels();
    this.featureEngineer = new FeatureEngineer();
    this.initializeModelPerformance();
  }
  
  private initializeModelPerformance() {
    this.modelPerformance.set('genre', {
      modelName: 'genre',
      accuracy: 0.0,
      precision: 0.0,
      recall: 0.0,
      f1Score: 0.0,
      lastUpdated: new Date(),
      trainingSamples: 0,
      confidence: 0.0
    });
    
    this.modelPerformance.set('mood', {
      modelName: 'mood',
      accuracy: 0.0,
      precision: 0.0,
      recall: 0.0,
      f1Score: 0.0,
      lastUpdated: new Date(),
      trainingSamples: 0,
      confidence: 0.0
    });
    
    this.modelPerformance.set('recommendation', {
      modelName: 'recommendation',
      accuracy: 0.0,
      precision: 0.0,
      recall: 0.0,
      f1Score: 0.0,
      lastUpdated: new Date(),
      trainingSamples: 0,
      confidence: 0.0
    });
  }
  
  // ============================================================================
  // FEEDBACK PROCESSING
  // ============================================================================
  
  async processFeedback(feedback: UserFeedback, track: ProcessedTrack): Promise<void> {
    console.log(`Processing feedback: ${feedback.action} for track ${feedback.trackId}`);
    
    // Store feedback
    this.feedbackHistory.push(feedback);
    
    // Update user profile
    await this.updateUserProfile(feedback, track);
    
    // Check if we need to retrain models
    if (this.shouldRetrainModels()) {
      await this.retrainModels();
    }
    
    // Update model performance metrics
    await this.updateModelPerformance(feedback, track);
  }
  
  private async updateUserProfile(feedback: UserFeedback, track: ProcessedTrack): Promise<void> {
    const userId = 'default'; // In a real app, this would come from authentication
    let profile = this.userProfiles.get(userId);
    
    if (!profile) {
      profile = this.createEmptyProfile();
      this.userProfiles.set(userId, profile);
    }
    
    // Update preferences based on feedback
    switch (feedback.action) {
      case 'like':
      case 'repeat':
      case 'save':
        this.updatePositivePreferences(profile, track);
        break;
      case 'dislike':
      case 'skip':
        this.updateNegativePreferences(profile, track);
        break;
    }
    
    // Update listening patterns
    this.updateListeningPatterns(profile, feedback, track);
    
    // Recalculate insights
    profile.insights = await this.calculatePersonalizedInsights(profile);
  }
  
  private createEmptyProfile(): PersonalizedInsights {
    return {
      userPreferences: {
        favoriteGenres: [],
        favoriteMoods: [],
        favoriteArtists: [],
        listeningPatterns: []
      },
      recommendations: {
        nextTracks: [],
        similarArtists: [],
        genreExplorations: [],
        moodSuggestions: []
      },
      insights: {
        discoveryRate: 0,
        diversityScore: 0,
        trendAnalysis: [],
        personalityTraits: []
      }
    };
  }
  
  private updatePositivePreferences(profile: PersonalizedInsights, track: ProcessedTrack): void {
    // Update favorite genres
    track.metadata.genres.forEach(genre => {
      if (!profile.userPreferences.favoriteGenres.includes(genre)) {
        profile.userPreferences.favoriteGenres.push(genre);
      }
    });
    
    // Update favorite moods
    track.metadata.moodTags.forEach(mood => {
      if (!profile.userPreferences.favoriteMoods.includes(mood)) {
        profile.userPreferences.favoriteMoods.push(mood);
      }
    });
    
    // Update favorite artists
    if (!profile.userPreferences.favoriteArtists.includes(track.artistName)) {
      profile.userPreferences.favoriteArtists.push(track.artistName);
    }
  }
  
  private updateNegativePreferences(profile: PersonalizedInsights, track: ProcessedTrack): void {
    // Remove or reduce preference for disliked content
    // This is a simplified version - in reality, you'd want more sophisticated logic
    const index = profile.userPreferences.favoriteArtists.indexOf(track.artistName);
    if (index > -1) {
      profile.userPreferences.favoriteArtists.splice(index, 1);
    }
  }
  
  private updateListeningPatterns(profile: PersonalizedInsights, feedback: UserFeedback, track: ProcessedTrack): void {
    const pattern = `${feedback.context?.activity || 'listening'}_${track.metadata.energyLevel}_${track.metadata.complexity}`;
    
    if (!profile.userPreferences.listeningPatterns.includes(pattern)) {
      profile.userPreferences.listeningPatterns.push(pattern);
    }
  }
  
  // ============================================================================
  // MODEL RETRAINING
  // ============================================================================
  
  private shouldRetrainModels(): boolean {
    const now = new Date();
    const timeSinceLastRetrain = now.getTime() - this.lastRetrainTime.getTime();
    
    return (
      this.feedbackHistory.length >= this.minSamplesForRetrain &&
      timeSinceLastRetrain >= this.retrainInterval
    );
  }
  
  private async retrainModels(): Promise<void> {
    console.log('Starting model retraining with user feedback...');
    
    try {
      // Prepare training data from feedback
      const trainingData = await this.prepareTrainingDataFromFeedback();
      
      // Retrain each model
      await this.retrainGenreModel(trainingData);
      await this.retrainMoodModel(trainingData);
      await this.retrainRecommendationModel(trainingData);
      
      this.lastRetrainTime = new Date();
      console.log('Model retraining completed successfully');
      
    } catch (error) {
      console.error('Error during model retraining:', error);
    }
  }
  
  private async prepareTrainingDataFromFeedback(): Promise<{
    genre: TrainingData;
    mood: TrainingData;
    recommendation: TrainingData;
  }> {
    const genreFeatures: number[][] = [];
    const genreLabels: number[] = [];
    const moodFeatures: number[][] = [];
    const moodLabels: number[] = [];
    const recommendationFeatures: number[][] = [];
    const recommendationLabels: number[] = [];
    
    // Process feedback history
    for (const feedback of this.feedbackHistory) {
      // Find the corresponding track (in a real app, you'd query the database)
      const track = await this.findTrackById(feedback.trackId);
      if (!track) continue;
      
      const features = this.featureEngineer.selectFeaturesForModel(track.features, 'genre');
      const moodFeatures_data = this.featureEngineer.selectFeaturesForModel(track.features, 'mood');
      const recFeatures = this.featureEngineer.selectFeaturesForModel(track.features, 'recommendation');
      
      // Convert feedback to labels
      const genreLabel = this.getGenreLabel(track.metadata.genres[0]);
      const moodLabel = this.getMoodLabel(track.metadata.moodTags[0]);
      const recommendationLabel = this.getRecommendationLabel(feedback.action);
      
      if (genreLabel !== -1) {
        genreFeatures.push(features);
        genreLabels.push(genreLabel);
      }
      
      if (moodLabel !== -1) {
        moodFeatures.push(moodFeatures_data);
        moodLabels.push(moodLabel);
      }
      
      recommendationFeatures.push(recFeatures);
      recommendationLabels.push(recommendationLabel);
    }
    
    return {
      genre: { features: genreFeatures, labels: genreLabels },
      mood: { features: moodFeatures, labels: moodLabels },
      recommendation: { features: recommendationFeatures, labels: recommendationLabels }
    };
  }
  
  private async retrainGenreModel(trainingData: any): Promise<void> {
    if (trainingData.genre.features.length === 0) return;
    
    try {
      const metrics = await this.models.trainGenreModel(trainingData.genre);
      this.updateModelPerformanceMetrics('genre', metrics);
    } catch (error) {
      console.error('Error retraining genre model:', error);
    }
  }
  
  private async retrainMoodModel(trainingData: any): Promise<void> {
    if (trainingData.mood.features.length === 0) return;
    
    try {
      const metrics = await this.models.trainMoodModel(trainingData.mood);
      this.updateModelPerformanceMetrics('mood', metrics);
    } catch (error) {
      console.error('Error retraining mood model:', error);
    }
  }
  
  private async retrainRecommendationModel(trainingData: any): Promise<void> {
    if (trainingData.recommendation.features.length === 0) return;
    
    try {
      const metrics = await this.models.trainRecommendationModel(trainingData.recommendation);
      this.updateModelPerformanceMetrics('recommendation', metrics);
    } catch (error) {
      console.error('Error retraining recommendation model:', error);
    }
  }
  
  // ============================================================================
  // PERSONALIZED INSIGHTS
  // ============================================================================
  
  async generatePersonalizedInsights(userId: string = 'default'): Promise<PersonalizedInsights> {
    let profile = this.userProfiles.get(userId);
    
    if (!profile) {
      profile = this.createEmptyProfile();
      this.userProfiles.set(userId, profile);
    }
    
    // Generate recommendations based on user preferences
    profile.recommendations = await this.generateRecommendations(profile);
    
    // Calculate insights
    profile.insights = await this.calculatePersonalizedInsights(profile);
    
    return profile;
  }
  
  private async generateRecommendations(profile: PersonalizedInsights): Promise<PersonalizedInsights['recommendations']> {
    // This would integrate with your recommendation engine
    // For now, return placeholder recommendations
    return {
      nextTracks: ['Track 1', 'Track 2', 'Track 3'],
      similarArtists: ['Artist 1', 'Artist 2', 'Artist 3'],
      genreExplorations: ['New Genre 1', 'New Genre 2'],
      moodSuggestions: ['Happy', 'Calm', 'Energetic']
    };
  }
  
  private async calculatePersonalizedInsights(profile: PersonalizedInsights): Promise<PersonalizedInsights['insights']> {
    const discoveryRate = this.calculateDiscoveryRate(profile);
    const diversityScore = this.calculateDiversityScore(profile);
    const trendAnalysis = this.analyzeTrends(profile);
    const personalityTraits = this.analyzePersonalityTraits(profile);
    
    return {
      discoveryRate,
      diversityScore,
      trendAnalysis,
      personalityTraits
    };
  }
  
  private calculateDiscoveryRate(profile: PersonalizedInsights): number {
    // Calculate how often user discovers new music
    const totalGenres = profile.userPreferences.favoriteGenres.length;
    const totalArtists = profile.userPreferences.favoriteArtists.length;
    
    // Simple heuristic - more diverse = higher discovery rate
    return Math.min(1, (totalGenres * 0.1 + totalArtists * 0.05));
  }
  
  private calculateDiversityScore(profile: PersonalizedInsights): number {
    // Calculate musical diversity based on genres and moods
    const genreDiversity = profile.userPreferences.favoriteGenres.length / 10; // Normalize to 0-1
    const moodDiversity = profile.userPreferences.favoriteMoods.length / 8; // Normalize to 0-1
    
    return (genreDiversity + moodDiversity) / 2;
  }
  
  private analyzeTrends(profile: PersonalizedInsights): string[] {
    const trends = [];
    
    if (profile.userPreferences.favoriteGenres.length > 5) {
      trends.push('You have eclectic taste across multiple genres');
    }
    
    if (profile.userPreferences.favoriteMoods.includes('energetic')) {
      trends.push('You prefer high-energy music');
    }
    
    if (profile.userPreferences.listeningPatterns.length > 3) {
      trends.push('Your listening varies by context and activity');
    }
    
    return trends;
  }
  
  private analyzePersonalityTraits(profile: PersonalizedInsights): string[] {
    const traits = [];
    
    const diversity = this.calculateDiversityScore(profile);
    if (diversity > 0.7) {
      traits.push('Musical Explorer');
    } else if (diversity > 0.4) {
      traits.push('Balanced Listener');
    } else {
      traits.push('Focused Enthusiast');
    }
    
    if (profile.userPreferences.favoriteMoods.includes('energetic')) {
      traits.push('High-Energy Person');
    }
    
    if (profile.userPreferences.favoriteGenres.includes('classical')) {
      traits.push('Sophisticated Listener');
    }
    
    return traits;
  }
  
  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  
  private async findTrackById(trackId: string): Promise<ProcessedTrack | null> {
    // In a real app, this would query your database
    // For now, return null as placeholder
    return null;
  }
  
  private getGenreLabel(genre: string): number {
    const genreMap: Record<string, number> = {
      'Pop': 0, 'Rock': 1, 'Hip-Hop': 2, 'Electronic': 3,
      'Jazz': 4, 'Classical': 5, 'Country': 6, 'R&B': 7
    };
    return genreMap[genre] ?? -1;
  }
  
  private getMoodLabel(mood: string): number {
    const moodMap: Record<string, number> = {
      'Happy': 0, 'Sad': 1, 'Angry': 2, 'Calm': 3,
      'Excited': 4, 'Romantic': 5, 'Nostalgic': 6
    };
    return moodMap[mood] ?? -1;
  }
  
  private getRecommendationLabel(action: string): number {
    const actionMap: Record<string, number> = {
      'like': 1, 'repeat': 1, 'save': 1, 'share': 1,
      'dislike': 0, 'skip': 0
    };
    return actionMap[action] ?? 0;
  }
  
  private updateModelPerformanceMetrics(modelName: string, metrics: any): void {
    const performance = this.modelPerformance.get(modelName);
    if (performance) {
      performance.accuracy = metrics.accuracy;
      performance.precision = metrics.precision;
      performance.recall = metrics.recall;
      performance.f1Score = metrics.f1Score;
      performance.lastUpdated = new Date();
      performance.trainingSamples += 1;
      performance.confidence = metrics.accuracy;
    }
  }
  
  private async updateModelPerformance(feedback: UserFeedback, track: ProcessedTrack): Promise<void> {
    // Update model performance based on feedback accuracy
    // This is a simplified version - in reality, you'd want more sophisticated evaluation
    console.log(`Updating model performance for feedback: ${feedback.action}`);
  }
  
  // ============================================================================
  // PUBLIC API
  // ============================================================================
  
  async getModelPerformance(): Promise<Map<string, ModelPerformance>> {
    return this.modelPerformance;
  }
  
  async getUserProfile(userId: string = 'default'): Promise<PersonalizedInsights> {
    return this.userProfiles.get(userId) || this.createEmptyProfile();
  }
  
  async getFeedbackHistory(): Promise<UserFeedback[]> {
    return this.feedbackHistory;
  }
  
  async getLearningSessions(): Promise<LearningSession[]> {
    return this.learningSessions;
  }
  
  // Cleanup
  dispose(): void {
    this.models.dispose();
  }
}
