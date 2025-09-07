// ============================================================================
// ADVANCED FEATURE ENGINEERING FOR MUSIC ANALYSIS
// ============================================================================

export interface AudioFeatures {
  // Basic Spotify features
  danceability: number;
  energy: number;
  valence: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
  speechiness: number;
  tempo: number;
  loudness: number;
  key: number;
  mode: number;
  timeSignature: number;
  
  // Advanced derived features
  spectralCentroid: number;
  spectralRolloff: number;
  zeroCrossingRate: number;
  mfcc: number[];
  chroma: number[];
  tonnetz: number[];
  
  // Temporal features
  tempoVariation: number;
  energyVariation: number;
  valenceVariation: number;
  
  // Contextual features
  timeOfDay: number;
  dayOfWeek: number;
  season: number;
  listeningDuration: number;
  skipRate: number;
  
  // Metadata features
  popularity: number;
  releaseYear: number;
  duration: number;
  explicit: boolean;
  artistPopularity: number;
  genreComplexity: number;
}

export interface ProcessedTrack {
  id: string;
  trackName: string;
  artistName: string;
  features: AudioFeatures;
  metadata: {
    releaseDate: string;
    album: string;
    genres: string[];
    subGenres: string[];
    moodTags: string[];
    energyLevel: 'low' | 'medium' | 'high';
    complexity: 'simple' | 'moderate' | 'complex';
  };
  contextual: {
    listeningContext: string;
    userMood: string;
    activity: string;
    environment: string;
  };
}

export class FeatureEngineer {
  private genreComplexityMap: Map<string, number>;
  private moodTagMap: Map<string, string[]>;
  
  constructor() {
    this.initializeMaps();
  }
  
  private initializeMaps() {
    // Genre complexity mapping (0-1 scale)
    this.genreComplexityMap = new Map([
      ['classical', 0.9],
      ['jazz', 0.8],
      ['progressive rock', 0.8],
      ['experimental', 0.9],
      ['ambient', 0.6],
      ['pop', 0.3],
      ['hip-hop', 0.4],
      ['country', 0.2],
      ['electronic', 0.7],
      ['rock', 0.5]
    ]);
    
    // Mood tag mapping
    this.moodTagMap = new Map([
      ['happy', ['upbeat', 'energetic', 'positive', 'cheerful']],
      ['sad', ['melancholic', 'emotional', 'introspective', 'somber']],
      ['angry', ['aggressive', 'intense', 'powerful', 'rebellious']],
      ['calm', ['peaceful', 'relaxing', 'serene', 'meditative']],
      ['excited', ['energetic', 'upbeat', 'dynamic', 'thrilling']],
      ['romantic', ['intimate', 'passionate', 'sensual', 'tender']],
      ['nostalgic', ['retro', 'vintage', 'sentimental', 'wistful']],
      ['mysterious', ['atmospheric', 'enigmatic', 'dark', 'intriguing']]
    ]);
  }
  
  async processTrack(track: any, context?: any): Promise<ProcessedTrack> {
    const features = await this.extractAdvancedFeatures(track);
    const metadata = this.extractMetadata(track);
    const contextual = this.extractContextualFeatures(track, context);
    
    return {
      id: track.id || `${track.trackName}-${track.artistName}`,
      trackName: track.trackName || 'Unknown',
      artistName: track.artistName || 'Unknown',
      features,
      metadata,
      contextual
    };
  }
  
  private async extractAdvancedFeatures(track: any): Promise<AudioFeatures> {
    const basicFeatures = this.extractBasicFeatures(track);
    const derivedFeatures = this.calculateDerivedFeatures(basicFeatures);
    const temporalFeatures = this.calculateTemporalFeatures(track);
    const contextualFeatures = this.calculateContextualFeatures(track);
    
    return {
      ...basicFeatures,
      ...derivedFeatures,
      ...temporalFeatures,
      ...contextualFeatures
    };
  }
  
  private extractBasicFeatures(track: any) {
    return {
      danceability: track.danceability || 0,
      energy: track.energy || 0,
      valence: track.valence || 0,
      acousticness: track.acousticness || 0,
      instrumentalness: track.instrumentalness || 0,
      liveness: track.liveness || 0,
      speechiness: track.speechiness || 0,
      tempo: track.tempo || 120,
      loudness: track.loudness || -10,
      key: track.key || 0,
      mode: track.mode || 0,
      timeSignature: track.timeSignature || 4,
      popularity: track.popularity || 0,
      releaseYear: this.extractYear(track.releaseDate),
      duration: track.duration || 180000,
      explicit: track.explicit === 'true'
    };
  }
  
  private calculateDerivedFeatures(basic: any): Partial<AudioFeatures> {
    // Spectral features (simulated based on audio features)
    const spectralCentroid = this.calculateSpectralCentroid(basic);
    const spectralRolloff = this.calculateSpectralRolloff(basic);
    const zeroCrossingRate = this.calculateZeroCrossingRate(basic);
    
    // MFCC features (13 coefficients)
    const mfcc = this.calculateMFCC(basic);
    
    // Chroma features (12 pitch classes)
    const chroma = this.calculateChroma(basic);
    
    // Tonnetz features (6 tonal features)
    const tonnetz = this.calculateTonnetz(basic);
    
    return {
      spectralCentroid,
      spectralRolloff,
      zeroCrossingRate,
      mfcc,
      chroma,
      tonnetz
    };
  }
  
  private calculateSpectralCentroid(features: any): number {
    // Higher energy and tempo = higher spectral centroid
    return (features.energy * 0.6 + (features.tempo / 200) * 0.4) * 1000;
  }
  
  private calculateSpectralRolloff(features: any): number {
    // Based on energy and acousticness
    return (features.energy * 0.7 + (1 - features.acousticness) * 0.3) * 800;
  }
  
  private calculateZeroCrossingRate(features: any): number {
    // Higher speechiness and energy = higher ZCR
    return (features.speechiness * 0.8 + features.energy * 0.2) * 0.5;
  }
  
  private calculateMFCC(features: any): number[] {
    // Generate 13 MFCC coefficients based on audio features
    const mfcc = [];
    for (let i = 0; i < 13; i++) {
      const base = features.energy * 0.3 + features.valence * 0.2 + features.danceability * 0.2;
      const variation = Math.sin(i * 0.5) * 0.1;
      mfcc.push(base + variation + (Math.random() - 0.5) * 0.1);
    }
    return mfcc;
  }
  
  private calculateChroma(features: any): number[] {
    // Generate 12 chroma features based on key and mode
    const chroma = new Array(12).fill(0);
    const key = features.key;
    const mode = features.mode;
    
    // Emphasize the key and related notes
    chroma[key] = 1.0;
    chroma[(key + 7) % 12] = 0.8; // Perfect fifth
    chroma[(key + 4) % 12] = 0.6; // Major third
    chroma[(key + 10) % 12] = 0.4; // Minor third
    
    return chroma;
  }
  
  private calculateTonnetz(features: any): number[] {
    // Generate 6 tonnetz features based on key and mode
    const tonnetz = [];
    const key = features.key;
    const mode = features.mode;
    
    for (let i = 0; i < 6; i++) {
      const base = Math.cos((key + i * 2) * Math.PI / 6) * 0.5 + 0.5;
      const modeInfluence = mode === 1 ? 1 : 0.7;
      tonnetz.push(base * modeInfluence);
    }
    
    return tonnetz;
  }
  
  private calculateTemporalFeatures(track: any): Partial<AudioFeatures> {
    // These would be calculated from listening history
    return {
      tempoVariation: Math.random() * 0.3,
      energyVariation: Math.random() * 0.2,
      valenceVariation: Math.random() * 0.25
    };
  }
  
  private calculateContextualFeatures(track: any): Partial<AudioFeatures> {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    const month = now.getMonth();
    
    return {
      timeOfDay: hour / 24,
      dayOfWeek: day / 7,
      season: month / 12,
      listeningDuration: track.duration || 180000,
      skipRate: Math.random() * 0.3,
      artistPopularity: track.artistPopularity || 50,
      genreComplexity: this.getGenreComplexity(track.genre)
    };
  }
  
  private getGenreComplexity(genre: string): number {
    return this.genreComplexityMap.get(genre?.toLowerCase()) || 0.5;
  }
  
  private extractMetadata(track: any) {
    const genres = this.extractGenres(track);
    const subGenres = this.extractSubGenres(track, genres);
    const moodTags = this.extractMoodTags(track);
    const energyLevel = this.determineEnergyLevel(track);
    const complexity = this.determineComplexity(track);
    
    return {
      releaseDate: track.releaseDate || '2020-01-01',
      album: track.albumName || 'Unknown Album',
      genres,
      subGenres,
      moodTags,
      energyLevel,
      complexity
    };
  }
  
  private extractGenres(track: any): string[] {
    // Extract genres from track data
    if (track.genre) {
      return [track.genre];
    }
    
    // Fallback to genre inference from audio features
    const features = this.extractBasicFeatures(track);
    return this.inferGenresFromFeatures(features);
  }
  
  private inferGenresFromFeatures(features: any): string[] {
    const genres = [];
    
    if (features.energy > 0.7 && features.danceability > 0.6) {
      genres.push('electronic');
    }
    if (features.acousticness > 0.7) {
      genres.push('acoustic');
    }
    if (features.speechiness > 0.3) {
      genres.push('hip-hop');
    }
    if (features.instrumentalness > 0.7) {
      genres.push('instrumental');
    }
    if (features.valence > 0.7 && features.energy > 0.5) {
      genres.push('pop');
    }
    
    return genres.length > 0 ? genres : ['unknown'];
  }
  
  private extractSubGenres(track: any, genres: string[]): string[] {
    const subGenres = [];
    
    genres.forEach(genre => {
      switch (genre.toLowerCase()) {
        case 'electronic':
          subGenres.push('house', 'techno', 'ambient');
          break;
        case 'rock':
          subGenres.push('alternative', 'indie', 'progressive');
          break;
        case 'hip-hop':
          subGenres.push('trap', 'conscious', 'old-school');
          break;
        case 'pop':
          subGenres.push('synthpop', 'indie-pop', 'electropop');
          break;
      }
    });
    
    return subGenres;
  }
  
  private extractMoodTags(track: any): string[] {
    const features = this.extractBasicFeatures(track);
    const moodTags = [];
    
    if (features.valence > 0.7) {
      moodTags.push('happy', 'upbeat');
    } else if (features.valence < 0.3) {
      moodTags.push('sad', 'melancholic');
    }
    
    if (features.energy > 0.7) {
      moodTags.push('energetic', 'dynamic');
    } else if (features.energy < 0.3) {
      moodTags.push('calm', 'peaceful');
    }
    
    if (features.danceability > 0.7) {
      moodTags.push('danceable', 'rhythmic');
    }
    
    return moodTags;
  }
  
  private determineEnergyLevel(track: any): 'low' | 'medium' | 'high' {
    const energy = track.energy || 0;
    if (energy > 0.7) return 'high';
    if (energy > 0.4) return 'medium';
    return 'low';
  }
  
  private determineComplexity(track: any): 'simple' | 'moderate' | 'complex' {
    const features = this.extractBasicFeatures(track);
    const complexity = (features.instrumentalness + features.acousticness + features.speechiness) / 3;
    
    if (complexity > 0.7) return 'complex';
    if (complexity > 0.4) return 'moderate';
    return 'simple';
  }
  
  private extractContextualFeatures(track: any, context?: any) {
    return {
      listeningContext: context?.context || 'unknown',
      userMood: context?.mood || 'neutral',
      activity: context?.activity || 'listening',
      environment: context?.environment || 'home'
    };
  }
  
  private extractYear(releaseDate: string): number {
    if (!releaseDate) return 2020;
    const year = new Date(releaseDate).getFullYear();
    return isNaN(year) ? 2020 : year;
  }
  
  // Feature normalization for ML models
  normalizeFeatures(features: AudioFeatures): AudioFeatures {
    const normalized = { ...features };
    
    // Normalize to 0-1 range
    normalized.tempo = Math.min(1, features.tempo / 200);
    normalized.loudness = Math.max(0, Math.min(1, (features.loudness + 60) / 60));
    normalized.popularity = features.popularity / 100;
    normalized.artistPopularity = features.artistPopularity / 100;
    normalized.listeningDuration = Math.min(1, features.listeningDuration / 600000); // 10 minutes max
    
    return normalized;
  }
  
  // Feature selection for different models
  selectFeaturesForModel(features: AudioFeatures, modelType: 'genre' | 'mood' | 'recommendation'): number[] {
    const baseFeatures = [
      features.danceability,
      features.energy,
      features.valence,
      features.acousticness,
      features.instrumentalness,
      features.liveness,
      features.speechiness,
      features.tempo,
      features.loudness,
      features.popularity
    ];
    
    switch (modelType) {
      case 'genre':
        return [...baseFeatures, ...features.mfcc, ...features.chroma];
      case 'mood':
        return [...baseFeatures, features.spectralCentroid, features.spectralRolloff];
      case 'recommendation':
        return [...baseFeatures, features.genreComplexity, features.artistPopularity];
      default:
        return baseFeatures;
    }
  }
}
