// ============================================================================
// CONTENT-BASED FILTERING WITH INCREMENTAL UPDATES
// ============================================================================

import { FeatureEngineer, ProcessedTrack, AudioFeatures } from './featureEngineering.js';
import { RealMLModels } from './realModels.js';

export interface RecommendationItem {
  trackId: string;
  trackName: string;
  artistName: string;
  similarity: number;
  confidence: number;
  reasons: string[];
  features: AudioFeatures;
  metadata: {
    genres: string[];
    moods: string[];
    popularity: number;
    releaseYear: number;
  };
}

export interface UserProfile {
  userId: string;
  preferences: {
    favoriteGenres: Map<string, number>; // genre -> weight
    favoriteArtists: Map<string, number>; // artist -> weight
    favoriteMoods: Map<string, number>; // mood -> weight
    audioPreferences: {
      energyRange: [number, number];
      valenceRange: [number, number];
      danceabilityRange: [number, number];
      tempoRange: [number, number];
    };
  };
  listeningHistory: {
    tracks: ProcessedTrack[];
    interactions: Map<string, number>; // trackId -> interaction score
    timestamps: Map<string, Date>; // trackId -> last played
  };
  profileVector: number[];
  lastUpdated: Date;
}

export interface FilteringResult {
  recommendations: RecommendationItem[];
  userProfile: UserProfile;
  filteringMetrics: {
    diversity: number;
    novelty: number;
    coverage: number;
    precision: number;
    recall: number;
  };
  explanations: {
    whyRecommended: string[];
    featureImportance: Map<string, number>;
    similarUsers: string[];
  };
}

export class ContentBasedFiltering {
  private featureEngineer: FeatureEngineer;
  private models: RealMLModels;
  private userProfiles: Map<string, UserProfile> = new Map();
  private itemFeatures: Map<string, AudioFeatures> = new Map();
  private genreVectors: Map<string, number[]> = new Map();
  private artistVectors: Map<string, number[]> = new Map();
  private moodVectors: Map<string, number[]> = new Map();
  
  // Incremental update parameters
  private updateThreshold: number = 10; // Update after 10 new interactions
  private decayFactor: number = 0.95; // Decay old preferences
  private learningRate: number = 0.1; // Learning rate for updates
  
  constructor() {
    this.featureEngineer = new FeatureEngineer();
    this.models = new RealMLModels();
    this.initializeVectorSpaces();
  }
  
  private initializeVectorSpaces(): void {
    // Initialize genre vectors (simplified)
    const genres = ['pop', 'rock', 'hip-hop', 'electronic', 'jazz', 'classical', 'country', 'r&b'];
    genres.forEach(genre => {
      this.genreVectors.set(genre, this.generateRandomVector(50));
    });
    
    // Initialize mood vectors
    const moods = ['happy', 'sad', 'energetic', 'calm', 'romantic', 'aggressive', 'nostalgic', 'mysterious'];
    moods.forEach(mood => {
      this.moodVectors.set(mood, this.generateRandomVector(30));
    });
  }
  
  private generateRandomVector(dimension: number): number[] {
    return Array.from({ length: dimension }, () => Math.random() - 0.5);
  }
  
  // ============================================================================
  // USER PROFILE MANAGEMENT
  // ============================================================================
  
  async updateUserProfile(
    userId: string,
    track: ProcessedTrack,
    interaction: 'like' | 'dislike' | 'skip' | 'repeat' | 'play' | 'save'
  ): Promise<void> {
    console.log(`Updating user profile for ${userId} with interaction: ${interaction}`);
    
    let profile = this.userProfiles.get(userId);
    if (!profile) {
      profile = this.createEmptyProfile(userId);
      this.userProfiles.set(userId, profile);
    }
    
    // Update listening history
    this.updateListeningHistory(profile, track, interaction);
    
    // Update preferences based on interaction
    this.updatePreferences(profile, track, interaction);
    
    // Update profile vector
    await this.updateProfileVector(profile);
    
    // Check if incremental update is needed
    if (this.shouldUpdateProfile(profile)) {
      await this.performIncrementalUpdate(profile);
    }
    
    profile.lastUpdated = new Date();
  }
  
  private createEmptyProfile(userId: string): UserProfile {
    return {
      userId,
      preferences: {
        favoriteGenres: new Map(),
        favoriteArtists: new Map(),
        favoriteMoods: new Map(),
        audioPreferences: {
          energyRange: [0, 1],
          valenceRange: [0, 1],
          danceabilityRange: [0, 1],
          tempoRange: [60, 200]
        }
      },
      listeningHistory: {
        tracks: [],
        interactions: new Map(),
        timestamps: new Map()
      },
      profileVector: this.generateRandomVector(100),
      lastUpdated: new Date()
    };
  }
  
  private updateListeningHistory(profile: UserProfile, track: ProcessedTrack, interaction: string): void {
    // Add track to history if not already present
    const existingTrack = profile.listeningHistory.tracks.find(t => t.id === track.id);
    if (!existingTrack) {
      profile.listeningHistory.tracks.push(track);
    }
    
    // Update interaction score
    const currentScore = profile.listeningHistory.interactions.get(track.id) || 0;
    const interactionScore = this.getInteractionScore(interaction);
    const newScore = currentScore + interactionScore;
    profile.listeningHistory.interactions.set(track.id, newScore);
    
    // Update timestamp
    profile.listeningHistory.timestamps.set(track.id, new Date());
    
    // Keep only last 1000 tracks
    if (profile.listeningHistory.tracks.length > 1000) {
      const oldestTrack = profile.listeningHistory.tracks.shift();
      if (oldestTrack) {
        profile.listeningHistory.interactions.delete(oldestTrack.id);
        profile.listeningHistory.timestamps.delete(oldestTrack.id);
      }
    }
  }
  
  private getInteractionScore(interaction: string): number {
    const scores: Record<string, number> = {
      'like': 2,
      'repeat': 3,
      'save': 2.5,
      'play': 1,
      'skip': -1,
      'dislike': -2
    };
    return scores[interaction] || 0;
  }
  
  private updatePreferences(profile: UserProfile, track: ProcessedTrack, interaction: string): void {
    const interactionScore = this.getInteractionScore(interaction);
    const weight = Math.abs(interactionScore) * this.learningRate;
    
    // Update genre preferences
    track.metadata.genres.forEach(genre => {
      const currentWeight = profile.preferences.favoriteGenres.get(genre) || 0;
      const newWeight = currentWeight + (interactionScore > 0 ? weight : -weight);
      profile.preferences.favoriteGenres.set(genre, Math.max(0, newWeight));
    });
    
    // Update artist preferences
    const currentArtistWeight = profile.preferences.favoriteArtists.get(track.artistName) || 0;
    const newArtistWeight = currentArtistWeight + (interactionScore > 0 ? weight : -weight);
    profile.preferences.favoriteArtists.set(track.artistName, Math.max(0, newArtistWeight));
    
    // Update mood preferences
    track.metadata.moodTags.forEach(mood => {
      const currentMoodWeight = profile.preferences.favoriteMoods.get(mood) || 0;
      const newMoodWeight = currentMoodWeight + (interactionScore > 0 ? weight : -weight);
      profile.preferences.favoriteMoods.set(mood, Math.max(0, newMoodWeight));
    });
    
    // Update audio preferences (running average)
    this.updateAudioPreferences(profile, track, interactionScore);
  }
  
  private updateAudioPreferences(profile: UserProfile, track: ProcessedTrack, interactionScore: number): void {
    const features = track.features;
    const weight = Math.abs(interactionScore) * this.learningRate;
    
    // Update energy range
    if (interactionScore > 0) {
      profile.preferences.audioPreferences.energyRange[0] = Math.min(
        profile.preferences.audioPreferences.energyRange[0],
        features.energy - weight
      );
      profile.preferences.audioPreferences.energyRange[1] = Math.max(
        profile.preferences.audioPreferences.energyRange[1],
        features.energy + weight
      );
    }
    
    // Update valence range
    if (interactionScore > 0) {
      profile.preferences.audioPreferences.valenceRange[0] = Math.min(
        profile.preferences.audioPreferences.valenceRange[0],
        features.valence - weight
      );
      profile.preferences.audioPreferences.valenceRange[1] = Math.max(
        profile.preferences.audioPreferences.valenceRange[1],
        features.valence + weight
      );
    }
    
    // Update danceability range
    if (interactionScore > 0) {
      profile.preferences.audioPreferences.danceabilityRange[0] = Math.min(
        profile.preferences.audioPreferences.danceabilityRange[0],
        features.danceability - weight
      );
      profile.preferences.audioPreferences.danceabilityRange[1] = Math.max(
        profile.preferences.audioPreferences.danceabilityRange[1],
        features.danceability + weight
      );
    }
    
    // Update tempo range
    if (interactionScore > 0) {
      profile.preferences.audioPreferences.tempoRange[0] = Math.min(
        profile.preferences.audioPreferences.tempoRange[0],
        features.tempo - weight * 20
      );
      profile.preferences.audioPreferences.tempoRange[1] = Math.max(
        profile.preferences.audioPreferences.tempoRange[1],
        features.tempo + weight * 20
      );
    }
  }
  
  private async updateProfileVector(profile: UserProfile): Promise<void> {
    const vector = new Array(100).fill(0);
    
    // Add genre preferences to vector
    profile.preferences.favoriteGenres.forEach((weight, genre) => {
      const genreVector = this.genreVectors.get(genre);
      if (genreVector) {
        for (let i = 0; i < Math.min(genreVector.length, 50); i++) {
          vector[i] += genreVector[i] * weight;
        }
      }
    });
    
    // Add mood preferences to vector
    profile.preferences.favoriteMoods.forEach((weight, mood) => {
      const moodVector = this.moodVectors.get(mood);
      if (moodVector) {
        for (let i = 0; i < Math.min(moodVector.length, 30); i++) {
          vector[50 + i] += moodVector[i] * weight;
        }
      }
    });
    
    // Add audio feature preferences to vector
    const audioPrefs = profile.preferences.audioPreferences;
    vector[80] = (audioPrefs.energyRange[0] + audioPrefs.energyRange[1]) / 2;
    vector[81] = (audioPrefs.valenceRange[0] + audioPrefs.valenceRange[1]) / 2;
    vector[82] = (audioPrefs.danceabilityRange[0] + audioPrefs.danceabilityRange[1]) / 2;
    vector[83] = (audioPrefs.tempoRange[0] + audioPrefs.tempoRange[1]) / 2;
    
    // Normalize vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= magnitude;
      }
    }
    
    profile.profileVector = vector;
  }
  
  // ============================================================================
  // INCREMENTAL UPDATES
  // ============================================================================
  
  private shouldUpdateProfile(profile: UserProfile): boolean {
    const recentInteractions = Array.from(profile.listeningHistory.timestamps.values())
      .filter(timestamp => Date.now() - timestamp.getTime() < 24 * 60 * 60 * 1000) // Last 24 hours
      .length;
    
    return recentInteractions >= this.updateThreshold;
  }
  
  private async performIncrementalUpdate(profile: UserProfile): Promise<void> {
    console.log(`Performing incremental update for user ${profile.userId}`);
    
    // Decay old preferences
    this.decayPreferences(profile);
    
    // Recalculate profile vector
    await this.updateProfileVector(profile);
    
    // Update genre/artist/mood vectors based on user feedback
    await this.updateVectorSpaces(profile);
    
    console.log(`Incremental update completed for user ${profile.userId}`);
  }
  
  private decayPreferences(profile: UserProfile): void {
    // Decay genre preferences
    profile.preferences.favoriteGenres.forEach((weight, genre) => {
      const newWeight = weight * this.decayFactor;
      if (newWeight < 0.01) {
        profile.preferences.favoriteGenres.delete(genre);
      } else {
        profile.preferences.favoriteGenres.set(genre, newWeight);
      }
    });
    
    // Decay artist preferences
    profile.preferences.favoriteArtists.forEach((weight, artist) => {
      const newWeight = weight * this.decayFactor;
      if (newWeight < 0.01) {
        profile.preferences.favoriteArtists.delete(artist);
      } else {
        profile.preferences.favoriteArtists.set(artist, newWeight);
      }
    });
    
    // Decay mood preferences
    profile.preferences.favoriteMoods.forEach((weight, mood) => {
      const newWeight = weight * this.decayFactor;
      if (newWeight < 0.01) {
        profile.preferences.favoriteMoods.delete(mood);
      } else {
        profile.preferences.favoriteMoods.set(mood, newWeight);
      }
    });
  }
  
  private async updateVectorSpaces(profile: UserProfile): Promise<void> {
    // Update genre vectors based on user interactions
    const positiveTracks = profile.listeningHistory.tracks.filter(track => {
      const score = profile.listeningHistory.interactions.get(track.id) || 0;
      return score > 0;
    });
    
    for (const track of positiveTracks) {
      track.metadata.genres.forEach(genre => {
        const currentVector = this.genreVectors.get(genre) || this.generateRandomVector(50);
        const trackVector = this.featureEngineer.selectFeaturesForModel(track.features, 'genre');
        
        // Update vector using gradient descent
        for (let i = 0; i < Math.min(currentVector.length, trackVector.length); i++) {
          currentVector[i] += this.learningRate * (trackVector[i] - currentVector[i]);
        }
        
        this.genreVectors.set(genre, currentVector);
      });
    }
  }
  
  // ============================================================================
  // RECOMMENDATION GENERATION
  // ============================================================================
  
  async generateRecommendations(
    userId: string,
    candidateTracks: ProcessedTrack[],
    numRecommendations: number = 10
  ): Promise<FilteringResult> {
    console.log(`Generating recommendations for user ${userId}`);
    
    const profile = this.userProfiles.get(userId);
    if (!profile) {
      throw new Error(`User profile not found for ${userId}`);
    }
    
    // Calculate similarities
    const recommendations: RecommendationItem[] = [];
    
    for (const track of candidateTracks) {
      const similarity = await this.calculateSimilarity(profile, track);
      const confidence = this.calculateConfidence(profile, track);
      const reasons = this.generateRecommendationReasons(profile, track);
      
      if (similarity > 0.3) { // Threshold for recommendations
        recommendations.push({
          trackId: track.id,
          trackName: track.trackName,
          artistName: track.artistName,
          similarity,
          confidence,
          reasons,
          features: track.features,
          metadata: {
            genres: track.metadata.genres,
            moods: track.metadata.moodTags,
            popularity: track.features.popularity,
            releaseYear: track.features.releaseYear
          }
        });
      }
    }
    
    // Sort by similarity and confidence
    recommendations.sort((a, b) => {
      const scoreA = a.similarity * 0.7 + a.confidence * 0.3;
      const scoreB = b.similarity * 0.7 + b.confidence * 0.3;
      return scoreB - scoreA;
    });
    
    // Apply diversity and novelty
    const diversifiedRecommendations = this.applyDiversityAndNovelty(
      recommendations.slice(0, numRecommendations * 2),
      profile,
      numRecommendations
    );
    
    // Calculate filtering metrics
    const filteringMetrics = this.calculateFilteringMetrics(diversifiedRecommendations, profile);
    
    // Generate explanations
    const explanations = this.generateExplanations(diversifiedRecommendations, profile);
    
    return {
      recommendations: diversifiedRecommendations,
      userProfile: profile,
      filteringMetrics,
      explanations
    };
  }
  
  private async calculateSimilarity(profile: UserProfile, track: ProcessedTrack): Promise<number> {
    let similarity = 0;
    let totalWeight = 0;
    
    // Genre similarity
    const genreWeight = 0.3;
    const genreSimilarity = this.calculateGenreSimilarity(profile, track);
    similarity += genreSimilarity * genreWeight;
    totalWeight += genreWeight;
    
    // Artist similarity
    const artistWeight = 0.2;
    const artistSimilarity = this.calculateArtistSimilarity(profile, track);
    similarity += artistSimilarity * artistWeight;
    totalWeight += artistWeight;
    
    // Mood similarity
    const moodWeight = 0.2;
    const moodSimilarity = this.calculateMoodSimilarity(profile, track);
    similarity += moodSimilarity * moodWeight;
    totalWeight += moodWeight;
    
    // Audio feature similarity
    const audioWeight = 0.3;
    const audioSimilarity = this.calculateAudioSimilarity(profile, track);
    similarity += audioSimilarity * audioWeight;
    totalWeight += audioWeight;
    
    return totalWeight > 0 ? similarity / totalWeight : 0;
  }
  
  private calculateGenreSimilarity(profile: UserProfile, track: ProcessedTrack): number {
    let similarity = 0;
    let totalWeight = 0;
    
    track.metadata.genres.forEach(genre => {
      const userWeight = profile.preferences.favoriteGenres.get(genre) || 0;
      if (userWeight > 0) {
        similarity += userWeight;
        totalWeight += 1;
      }
    });
    
    return totalWeight > 0 ? similarity / totalWeight : 0;
  }
  
  private calculateArtistSimilarity(profile: UserProfile, track: ProcessedTrack): number {
    const userWeight = profile.preferences.favoriteArtists.get(track.artistName) || 0;
    return Math.min(1, userWeight);
  }
  
  private calculateMoodSimilarity(profile: UserProfile, track: ProcessedTrack): number {
    let similarity = 0;
    let totalWeight = 0;
    
    track.metadata.moodTags.forEach(mood => {
      const userWeight = profile.preferences.favoriteMoods.get(mood) || 0;
      if (userWeight > 0) {
        similarity += userWeight;
        totalWeight += 1;
      }
    });
    
    return totalWeight > 0 ? similarity / totalWeight : 0;
  }
  
  private calculateAudioSimilarity(profile: UserProfile, track: ProcessedTrack): number {
    const features = track.features;
    const prefs = profile.preferences.audioPreferences;
    
    let similarity = 0;
    let totalWeight = 0;
    
    // Energy similarity
    const energyInRange = features.energy >= prefs.energyRange[0] && features.energy <= prefs.energyRange[1];
    similarity += energyInRange ? 1 : 0;
    totalWeight += 1;
    
    // Valence similarity
    const valenceInRange = features.valence >= prefs.valenceRange[0] && features.valence <= prefs.valenceRange[1];
    similarity += valenceInRange ? 1 : 0;
    totalWeight += 1;
    
    // Danceability similarity
    const danceabilityInRange = features.danceability >= prefs.danceabilityRange[0] && features.danceability <= prefs.danceabilityRange[1];
    similarity += danceabilityInRange ? 1 : 0;
    totalWeight += 1;
    
    // Tempo similarity
    const tempoInRange = features.tempo >= prefs.tempoRange[0] && features.tempo <= prefs.tempoRange[1];
    similarity += tempoInRange ? 1 : 0;
    totalWeight += 1;
    
    return totalWeight > 0 ? similarity / totalWeight : 0;
  }
  
  private calculateConfidence(profile: UserProfile, track: ProcessedTrack): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence for known genres
    const knownGenres = track.metadata.genres.filter(genre => 
      profile.preferences.favoriteGenres.has(genre)
    ).length;
    confidence += knownGenres * 0.1;
    
    // Increase confidence for known artists
    if (profile.preferences.favoriteArtists.has(track.artistName)) {
      confidence += 0.2;
    }
    
    // Increase confidence for known moods
    const knownMoods = track.metadata.moodTags.filter(mood => 
      profile.preferences.favoriteMoods.has(mood)
    ).length;
    confidence += knownMoods * 0.1;
    
    // Increase confidence based on listening history size
    const historySize = profile.listeningHistory.tracks.length;
    confidence += Math.min(0.2, historySize / 100);
    
    return Math.min(1, confidence);
  }
  
  private generateRecommendationReasons(profile: UserProfile, track: ProcessedTrack): string[] {
    const reasons: string[] = [];
    
    // Genre reasons
    track.metadata.genres.forEach(genre => {
      const weight = profile.preferences.favoriteGenres.get(genre);
      if (weight && weight > 0.5) {
        reasons.push(`You like ${genre} music`);
      }
    });
    
    // Artist reasons
    const artistWeight = profile.preferences.favoriteArtists.get(track.artistName);
    if (artistWeight && artistWeight > 0.5) {
      reasons.push(`You like ${track.artistName}`);
    }
    
    // Mood reasons
    track.metadata.moodTags.forEach(mood => {
      const weight = profile.preferences.favoriteMoods.get(mood);
      if (weight && weight > 0.5) {
        reasons.push(`You enjoy ${mood} music`);
      }
    });
    
    // Audio feature reasons
    const features = track.features;
    const prefs = profile.preferences.audioPreferences;
    
    if (features.energy >= prefs.energyRange[0] && features.energy <= prefs.energyRange[1]) {
      reasons.push('Matches your energy preferences');
    }
    
    if (features.valence >= prefs.valenceRange[0] && features.valence <= prefs.valenceRange[1]) {
      reasons.push('Matches your mood preferences');
    }
    
    return reasons.length > 0 ? reasons : ['Similar to your listening patterns'];
  }
  
  // ============================================================================
  // DIVERSITY AND NOVELTY
  // ============================================================================
  
  private applyDiversityAndNovelty(
    recommendations: RecommendationItem[],
    profile: UserProfile,
    numRecommendations: number
  ): RecommendationItem[] {
    const diversified: RecommendationItem[] = [];
    const usedGenres = new Set<string>();
    const usedArtists = new Set<string>();
    
    // First pass: Add diverse recommendations
    for (const rec of recommendations) {
      if (diversified.length >= numRecommendations) break;
      
      const genreOverlap = rec.metadata.genres.some(genre => usedGenres.has(genre));
      const artistOverlap = usedArtists.has(rec.artistName);
      
      // Prefer diverse recommendations
      if (!genreOverlap || !artistOverlap || diversified.length < numRecommendations * 0.7) {
        diversified.push(rec);
        rec.metadata.genres.forEach(genre => usedGenres.add(genre));
        usedArtists.add(rec.artistName);
      }
    }
    
    // Second pass: Fill remaining slots with best remaining recommendations
    for (const rec of recommendations) {
      if (diversified.length >= numRecommendations) break;
      if (!diversified.find(d => d.trackId === rec.trackId)) {
        diversified.push(rec);
      }
    }
    
    return diversified.slice(0, numRecommendations);
  }
  
  // ============================================================================
  // METRICS AND EXPLANATIONS
  // ============================================================================
  
  private calculateFilteringMetrics(
    recommendations: RecommendationItem[],
    profile: UserProfile
  ): FilteringResult['filteringMetrics'] {
    // Diversity: How many different genres/artists are represented
    const uniqueGenres = new Set<string>();
    const uniqueArtists = new Set<string>();
    
    recommendations.forEach(rec => {
      rec.metadata.genres.forEach(genre => uniqueGenres.add(genre));
      uniqueArtists.add(rec.artistName);
    });
    
    const diversity = (uniqueGenres.size + uniqueArtists.size) / (recommendations.length * 2);
    
    // Novelty: How many recommendations are from new artists/genres
    const knownArtists = new Set(profile.preferences.favoriteArtists.keys());
    const knownGenres = new Set(profile.preferences.favoriteGenres.keys());
    
    const novelArtists = recommendations.filter(rec => !knownArtists.has(rec.artistName)).length;
    const novelGenres = recommendations.filter(rec => 
      !rec.metadata.genres.some(genre => knownGenres.has(genre))
    ).length;
    
    const novelty = (novelArtists + novelGenres) / (recommendations.length * 2);
    
    // Coverage: How well the recommendations cover user preferences
    const coveredGenres = new Set<string>();
    const coveredArtists = new Set<string>();
    
    recommendations.forEach(rec => {
      rec.metadata.genres.forEach(genre => {
        if (profile.preferences.favoriteGenres.has(genre)) {
          coveredGenres.add(genre);
        }
      });
      if (profile.preferences.favoriteArtists.has(rec.artistName)) {
        coveredArtists.add(rec.artistName);
      }
    });
    
    const genreCoverage = coveredGenres.size / Math.max(1, profile.preferences.favoriteGenres.size);
    const artistCoverage = coveredArtists.size / Math.max(1, profile.preferences.favoriteArtists.size);
    const coverage = (genreCoverage + artistCoverage) / 2;
    
    // Precision and Recall (simplified)
    const relevantRecommendations = recommendations.filter(rec => rec.similarity > 0.5).length;
    const precision = relevantRecommendations / Math.max(1, recommendations.length);
    const recall = relevantRecommendations / Math.max(1, profile.listeningHistory.tracks.length);
    
    return {
      diversity: Math.min(1, diversity),
      novelty: Math.min(1, novelty),
      coverage: Math.min(1, coverage),
      precision: Math.min(1, precision),
      recall: Math.min(1, recall)
    };
  }
  
  private generateExplanations(
    recommendations: RecommendationItem[],
    profile: UserProfile
  ): FilteringResult['explanations'] {
    const whyRecommended: string[] = [];
    const featureImportance = new Map<string, number>();
    
    // Analyze recommendation patterns
    const genreCounts = new Map<string, number>();
    const artistCounts = new Map<string, number>();
    
    recommendations.forEach(rec => {
      rec.metadata.genres.forEach(genre => {
        genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
      });
      artistCounts.set(rec.artistName, (artistCounts.get(rec.artistName) || 0) + 1);
    });
    
    // Generate explanations
    const topGenres = Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    topGenres.forEach(([genre, count]) => {
      whyRecommended.push(`Based on your love for ${genre} music (${count} recommendations)`);
      featureImportance.set(genre, count / recommendations.length);
    });
    
    const topArtists = Array.from(artistCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);
    
    topArtists.forEach(([artist, count]) => {
      whyRecommended.push(`Including ${artist} (${count} tracks)`);
      featureImportance.set(artist, count / recommendations.length);
    });
    
    // Add general explanations
    if (recommendations.length > 0) {
      const avgSimilarity = recommendations.reduce((sum, rec) => sum + rec.similarity, 0) / recommendations.length;
      whyRecommended.push(`Average similarity: ${(avgSimilarity * 100).toFixed(1)}%`);
      featureImportance.set('similarity', avgSimilarity);
    }
    
    return {
      whyRecommended,
      featureImportance,
      similarUsers: [] // Would be populated in a collaborative filtering system
    };
  }
  
  // ============================================================================
  // PUBLIC API
  // ============================================================================
  
  getUserProfile(userId: string): UserProfile | undefined {
    return this.userProfiles.get(userId);
  }
  
  getAllUserProfiles(): Map<string, UserProfile> {
    return this.userProfiles;
  }
  
  getItemFeatures(trackId: string): AudioFeatures | undefined {
    return this.itemFeatures.get(trackId);
  }
  
  // Cleanup
  dispose(): void {
    this.models.dispose();
  }
}
