// ============================================================================
// CONTEXTUAL MOOD DETECTION SYSTEM
// ============================================================================

export interface MoodContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: 'weekday' | 'weekend';
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  weather: 'sunny' | 'rainy' | 'cloudy' | 'snowy' | 'unknown';
  activity: 'working' | 'exercising' | 'relaxing' | 'socializing' | 'commuting' | 'studying' | 'unknown';
  environment: 'home' | 'office' | 'gym' | 'car' | 'public' | 'outdoor' | 'unknown';
  socialContext: 'alone' | 'with-friends' | 'with-family' | 'with-partner' | 'unknown';
  energyLevel: 'low' | 'medium' | 'high';
  stressLevel: 'low' | 'medium' | 'high';
  recentEvents: string[];
}

export interface MoodState {
  primaryMood: string;
  secondaryMoods: string[];
  intensity: number; // 0-1 scale
  confidence: number; // 0-1 scale
  emotionalValence: number; // -1 to 1 (negative to positive)
  emotionalArousal: number; // 0-1 scale (calm to excited)
  emotionalDominance: number; // 0-1 scale (submissive to dominant)
  moodStability: number; // 0-1 scale (volatile to stable)
  contextualFactors: {
    timeInfluence: number;
    activityInfluence: number;
    environmentInfluence: number;
    socialInfluence: number;
  };
  moodHistory: {
    previousMoods: string[];
    moodTransitions: string[];
    averageMood: string;
    moodVariability: number;
  };
}

export interface ContextualMoodResult {
  currentMood: MoodState;
  predictedMood: MoodState;
  moodRecommendations: {
    musicSuggestions: string[];
    moodEnhancement: string[];
    moodStabilization: string[];
  };
  contextualInsights: {
    moodPatterns: string[];
    environmentalTriggers: string[];
    optimalListeningTimes: string[];
    moodInfluencers: string[];
  };
}

export class ContextualMoodDetector {
  private moodContexts: Map<string, MoodContext> = new Map();
  private moodHistory: Map<string, MoodState[]> = new Map();
  private contextualRules: Map<string, any> = new Map();
  private moodTransitions: Map<string, number> = new Map();
  
  constructor() {
    this.initializeContextualRules();
    this.initializeMoodTransitions();
  }
  
  private initializeContextualRules(): void {
    // Time-based mood rules
    this.contextualRules.set('time-morning', {
      preferredMoods: ['energetic', 'optimistic', 'focused'],
      avoidedMoods: ['melancholic', 'nostalgic'],
      intensity: 0.7,
      influence: 0.3
    });
    
    this.contextualRules.set('time-afternoon', {
      preferredMoods: ['productive', 'balanced', 'motivated'],
      avoidedMoods: ['sleepy', 'lazy'],
      intensity: 0.6,
      influence: 0.2
    });
    
    this.contextualRules.set('time-evening', {
      preferredMoods: ['relaxed', 'social', 'romantic'],
      avoidedMoods: ['aggressive', 'anxious'],
      intensity: 0.5,
      influence: 0.4
    });
    
    this.contextualRules.set('time-night', {
      preferredMoods: ['calm', 'introspective', 'dreamy'],
      avoidedMoods: ['energetic', 'aggressive'],
      intensity: 0.3,
      influence: 0.5
    });
    
    // Activity-based mood rules
    this.contextualRules.set('activity-working', {
      preferredMoods: ['focused', 'productive', 'concentrated'],
      avoidedMoods: ['distracted', 'lazy'],
      intensity: 0.6,
      influence: 0.4
    });
    
    this.contextualRules.set('activity-exercising', {
      preferredMoods: ['energetic', 'motivated', 'pumped'],
      avoidedMoods: ['calm', 'relaxed'],
      intensity: 0.9,
      influence: 0.6
    });
    
    this.contextualRules.set('activity-relaxing', {
      preferredMoods: ['calm', 'peaceful', 'serene'],
      avoidedMoods: ['energetic', 'aggressive'],
      intensity: 0.3,
      influence: 0.5
    });
    
    this.contextualRules.set('activity-socializing', {
      preferredMoods: ['happy', 'social', 'upbeat'],
      avoidedMoods: ['lonely', 'melancholic'],
      intensity: 0.7,
      influence: 0.4
    });
    
    // Environment-based mood rules
    this.contextualRules.set('environment-home', {
      preferredMoods: ['comfortable', 'relaxed', 'intimate'],
      avoidedMoods: ['stressed', 'anxious'],
      intensity: 0.4,
      influence: 0.3
    });
    
    this.contextualRules.set('environment-office', {
      preferredMoods: ['focused', 'professional', 'productive'],
      avoidedMoods: ['distracted', 'lazy'],
      intensity: 0.6,
      influence: 0.4
    });
    
    this.contextualRules.set('environment-gym', {
      preferredMoods: ['energetic', 'motivated', 'powerful'],
      avoidedMoods: ['tired', 'lazy'],
      intensity: 0.9,
      influence: 0.6
    });
    
    this.contextualRules.set('environment-car', {
      preferredMoods: ['focused', 'alert', 'comfortable'],
      avoidedMoods: ['sleepy', 'distracted'],
      intensity: 0.7,
      influence: 0.5
    });
    
    // Weather-based mood rules
    this.contextualRules.set('weather-sunny', {
      preferredMoods: ['happy', 'energetic', 'optimistic'],
      avoidedMoods: ['melancholic', 'gloomy'],
      intensity: 0.7,
      influence: 0.3
    });
    
    this.contextualRules.set('weather-rainy', {
      preferredMoods: ['cozy', 'introspective', 'calm'],
      avoidedMoods: ['energetic', 'aggressive'],
      intensity: 0.5,
      influence: 0.4
    });
    
    this.contextualRules.set('weather-cloudy', {
      preferredMoods: ['neutral', 'balanced', 'contemplative'],
      avoidedMoods: ['extreme'],
      intensity: 0.4,
      influence: 0.2
    });
  }
  
  private initializeMoodTransitions(): void {
    // Define likely mood transitions
    this.moodTransitions.set('calm->energetic', 0.3);
    this.moodTransitions.set('energetic->calm', 0.4);
    this.moodTransitions.set('happy->sad', 0.2);
    this.moodTransitions.set('sad->happy', 0.3);
    this.moodTransitions.set('focused->relaxed', 0.5);
    this.moodTransitions.set('relaxed->focused', 0.4);
    this.moodTransitions.set('stressed->calm', 0.6);
    this.moodTransitions.set('calm->stressed', 0.3);
  }
  
  // ============================================================================
  // CONTEXTUAL MOOD DETECTION
  // ============================================================================
  
  async detectContextualMood(
    audioFeatures: any,
    context: MoodContext,
    userId: string = 'default'
  ): Promise<ContextualMoodResult> {
    console.log('Detecting contextual mood...');
    
    // Get user's mood history
    const moodHistory = this.moodHistory.get(userId) || [];
    
    // Detect current mood from audio features
    const currentMood = await this.detectCurrentMood(audioFeatures, context);
    
    // Predict future mood based on context and history
    const predictedMood = await this.predictMood(context, moodHistory);
    
    // Generate recommendations
    const moodRecommendations = await this.generateMoodRecommendations(currentMood, predictedMood, context);
    
    // Generate contextual insights
    const contextualInsights = await this.generateContextualInsights(moodHistory, context);
    
    // Update mood history
    this.updateMoodHistory(userId, currentMood);
    
    return {
      currentMood,
      predictedMood,
      moodRecommendations,
      contextualInsights
    };
  }
  
  private async detectCurrentMood(audioFeatures: any, context: MoodContext): Promise<MoodState> {
    // Base mood detection from audio features
    const baseMood = this.detectBaseMood(audioFeatures);
    
    // Apply contextual adjustments
    const contextualMood = this.applyContextualAdjustments(baseMood, context);
    
    // Calculate emotional dimensions
    const emotionalDimensions = this.calculateEmotionalDimensions(audioFeatures, context);
    
    // Calculate mood stability
    const moodStability = this.calculateMoodStability(contextualMood, context);
    
    // Calculate contextual influences
    const contextualFactors = this.calculateContextualFactors(context);
    
    return {
      primaryMood: contextualMood.primaryMood,
      secondaryMoods: contextualMood.secondaryMoods,
      intensity: contextualMood.intensity,
      confidence: contextualMood.confidence,
      emotionalValence: emotionalDimensions.valence,
      emotionalArousal: emotionalDimensions.arousal,
      emotionalDominance: emotionalDimensions.dominance,
      moodStability,
      contextualFactors,
      moodHistory: {
        previousMoods: [],
        moodTransitions: [],
        averageMood: 'neutral',
        moodVariability: 0.5
      }
    };
  }
  
  private detectBaseMood(audioFeatures: any): { primaryMood: string; secondaryMoods: string[]; intensity: number; confidence: number } {
    const { energy, valence, danceability, acousticness, tempo } = audioFeatures;
    
    let primaryMood = 'neutral';
    let secondaryMoods: string[] = [];
    let intensity = 0.5;
    let confidence = 0.7;
    
    // High energy + high valence = happy/energetic
    if (energy > 0.7 && valence > 0.6) {
      primaryMood = 'energetic';
      secondaryMoods = ['happy', 'upbeat'];
      intensity = Math.min(1, (energy + valence) / 2);
      confidence = 0.8;
    }
    // High energy + low valence = angry/aggressive
    else if (energy > 0.7 && valence < 0.4) {
      primaryMood = 'aggressive';
      secondaryMoods = ['angry', 'intense'];
      intensity = Math.min(1, energy + (1 - valence)) / 2;
      confidence = 0.8;
    }
    // Low energy + low valence = sad/melancholic
    else if (energy < 0.4 && valence < 0.4) {
      primaryMood = 'melancholic';
      secondaryMoods = ['sad', 'introspective'];
      intensity = Math.min(1, (1 - energy) + (1 - valence)) / 2;
      confidence = 0.8;
    }
    // Low energy + high valence = calm/peaceful
    else if (energy < 0.4 && valence > 0.6) {
      primaryMood = 'calm';
      secondaryMoods = ['peaceful', 'serene'];
      intensity = Math.min(1, (1 - energy) + valence) / 2;
      confidence = 0.8;
    }
    // High danceability = social/party
    else if (danceability > 0.7) {
      primaryMood = 'social';
      secondaryMoods = ['party', 'fun'];
      intensity = danceability;
      confidence = 0.7;
    }
    // High acousticness = intimate/romantic
    else if (acousticness > 0.7) {
      primaryMood = 'intimate';
      secondaryMoods = ['romantic', 'personal'];
      intensity = acousticness;
      confidence = 0.7;
    }
    
    return { primaryMood, secondaryMoods, intensity, confidence };
  }
  
  private applyContextualAdjustments(
    baseMood: any,
    context: MoodContext
  ): { primaryMood: string; secondaryMoods: string[]; intensity: number; confidence: number } {
    let adjustedMood = { ...baseMood };
    
    // Apply time-based adjustments
    const timeRule = this.contextualRules.get(`time-${context.timeOfDay}`);
    if (timeRule) {
      if (timeRule.preferredMoods.includes(adjustedMood.primaryMood)) {
        adjustedMood.intensity = Math.min(1, adjustedMood.intensity + timeRule.influence);
        adjustedMood.confidence = Math.min(1, adjustedMood.confidence + 0.1);
      } else if (timeRule.avoidedMoods.includes(adjustedMood.primaryMood)) {
        adjustedMood.intensity = Math.max(0, adjustedMood.intensity - timeRule.influence);
        adjustedMood.confidence = Math.max(0, adjustedMood.confidence - 0.1);
      }
    }
    
    // Apply activity-based adjustments
    const activityRule = this.contextualRules.get(`activity-${context.activity}`);
    if (activityRule) {
      if (activityRule.preferredMoods.includes(adjustedMood.primaryMood)) {
        adjustedMood.intensity = Math.min(1, adjustedMood.intensity + activityRule.influence);
        adjustedMood.confidence = Math.min(1, adjustedMood.confidence + 0.1);
      } else if (activityRule.avoidedMoods.includes(adjustedMood.primaryMood)) {
        adjustedMood.intensity = Math.max(0, adjustedMood.intensity - activityRule.influence);
        adjustedMood.confidence = Math.max(0, adjustedMood.confidence - 0.1);
      }
    }
    
    // Apply environment-based adjustments
    const environmentRule = this.contextualRules.get(`environment-${context.environment}`);
    if (environmentRule) {
      if (environmentRule.preferredMoods.includes(adjustedMood.primaryMood)) {
        adjustedMood.intensity = Math.min(1, adjustedMood.intensity + environmentRule.influence);
        adjustedMood.confidence = Math.min(1, adjustedMood.confidence + 0.1);
      } else if (environmentRule.avoidedMoods.includes(adjustedMood.primaryMood)) {
        adjustedMood.intensity = Math.max(0, adjustedMood.intensity - environmentRule.influence);
        adjustedMood.confidence = Math.max(0, adjustedMood.confidence - 0.1);
      }
    }
    
    // Apply weather-based adjustments
    const weatherRule = this.contextualRules.get(`weather-${context.weather}`);
    if (weatherRule) {
      if (weatherRule.preferredMoods.includes(adjustedMood.primaryMood)) {
        adjustedMood.intensity = Math.min(1, adjustedMood.intensity + weatherRule.influence);
        adjustedMood.confidence = Math.min(1, adjustedMood.confidence + 0.1);
      } else if (weatherRule.avoidedMoods.includes(adjustedMood.primaryMood)) {
        adjustedMood.intensity = Math.max(0, adjustedMood.intensity - weatherRule.influence);
        adjustedMood.confidence = Math.max(0, adjustedMood.confidence - 0.1);
      }
    }
    
    return adjustedMood;
  }
  
  private calculateEmotionalDimensions(audioFeatures: any, context: MoodContext): {
    valence: number;
    arousal: number;
    dominance: number;
  } {
    const { energy, valence, danceability, acousticness, tempo } = audioFeatures;
    
    // Valence: positive/negative emotional tone
    let emotionalValence = valence;
    
    // Arousal: activation level (calm to excited)
    let emotionalArousal = (energy + danceability + (tempo / 200)) / 3;
    
    // Dominance: control level (submissive to dominant)
    let emotionalDominance = (energy + (1 - acousticness)) / 2;
    
    // Apply contextual adjustments
    if (context.activity === 'exercising') {
      emotionalArousal = Math.min(1, emotionalArousal + 0.3);
      emotionalDominance = Math.min(1, emotionalDominance + 0.2);
    } else if (context.activity === 'relaxing') {
      emotionalArousal = Math.max(0, emotionalArousal - 0.3);
      emotionalDominance = Math.max(0, emotionalDominance - 0.2);
    }
    
    if (context.environment === 'gym') {
      emotionalArousal = Math.min(1, emotionalArousal + 0.2);
      emotionalDominance = Math.min(1, emotionalDominance + 0.3);
    } else if (context.environment === 'home') {
      emotionalArousal = Math.max(0, emotionalArousal - 0.2);
      emotionalDominance = Math.max(0, emotionalDominance - 0.1);
    }
    
    return {
      valence: emotionalValence,
      arousal: emotionalArousal,
      dominance: emotionalDominance
    };
  }
  
  private calculateMoodStability(mood: any, context: MoodContext): number {
    let stability = 0.5; // Base stability
    
    // Time of day affects stability
    if (context.timeOfDay === 'morning' || context.timeOfDay === 'evening') {
      stability += 0.1;
    } else if (context.timeOfDay === 'night') {
      stability -= 0.1;
    }
    
    // Activity affects stability
    if (context.activity === 'relaxing' || context.activity === 'working') {
      stability += 0.1;
    } else if (context.activity === 'exercising' || context.activity === 'socializing') {
      stability -= 0.1;
    }
    
    // Environment affects stability
    if (context.environment === 'home') {
      stability += 0.1;
    } else if (context.environment === 'public' || context.environment === 'car') {
      stability -= 0.1;
    }
    
    // Social context affects stability
    if (context.socialContext === 'alone') {
      stability += 0.1;
    } else if (context.socialContext === 'with-friends') {
      stability -= 0.1;
    }
    
    return Math.max(0, Math.min(1, stability));
  }
  
  private calculateContextualFactors(context: MoodContext): MoodState['contextualFactors'] {
    return {
      timeInfluence: this.getTimeInfluence(context.timeOfDay),
      activityInfluence: this.getActivityInfluence(context.activity),
      environmentInfluence: this.getEnvironmentInfluence(context.environment),
      socialInfluence: this.getSocialInfluence(context.socialContext)
    };
  }
  
  private getTimeInfluence(timeOfDay: string): number {
    const influences: Record<string, number> = {
      'morning': 0.3,
      'afternoon': 0.2,
      'evening': 0.4,
      'night': 0.5
    };
    return influences[timeOfDay] || 0.3;
  }
  
  private getActivityInfluence(activity: string): number {
    const influences: Record<string, number> = {
      'working': 0.4,
      'exercising': 0.6,
      'relaxing': 0.5,
      'socializing': 0.4,
      'commuting': 0.3,
      'studying': 0.4,
      'unknown': 0.2
    };
    return influences[activity] || 0.2;
  }
  
  private getEnvironmentInfluence(environment: string): number {
    const influences: Record<string, number> = {
      'home': 0.3,
      'office': 0.4,
      'gym': 0.6,
      'car': 0.5,
      'public': 0.4,
      'outdoor': 0.3,
      'unknown': 0.2
    };
    return influences[environment] || 0.2;
  }
  
  private getSocialInfluence(socialContext: string): number {
    const influences: Record<string, number> = {
      'alone': 0.3,
      'with-friends': 0.5,
      'with-family': 0.4,
      'with-partner': 0.4,
      'unknown': 0.2
    };
    return influences[socialContext] || 0.2;
  }
  
  // ============================================================================
  // MOOD PREDICTION
  // ============================================================================
  
  private async predictMood(context: MoodContext, moodHistory: MoodState[]): Promise<MoodState> {
    // Simple mood prediction based on context and history
    let predictedMood = 'neutral';
    let predictedIntensity = 0.5;
    let predictedConfidence = 0.6;
    
    // Predict based on time of day
    const timePredictions: Record<string, string> = {
      'morning': 'energetic',
      'afternoon': 'focused',
      'evening': 'relaxed',
      'night': 'calm'
    };
    
    predictedMood = timePredictions[context.timeOfDay] || 'neutral';
    
    // Adjust based on activity
    const activityPredictions: Record<string, string> = {
      'working': 'focused',
      'exercising': 'energetic',
      'relaxing': 'calm',
      'socializing': 'happy',
      'commuting': 'focused',
      'studying': 'concentrated'
    };
    
    if (activityPredictions[context.activity]) {
      predictedMood = activityPredictions[context.activity];
      predictedIntensity = 0.7;
    }
    
    // Adjust based on recent mood history
    if (moodHistory.length > 0) {
      const recentMood = moodHistory[moodHistory.length - 1];
      const transitionKey = `${recentMood.primaryMood}->${predictedMood}`;
      const transitionProbability = this.moodTransitions.get(transitionKey) || 0.5;
      
      if (transitionProbability > 0.6) {
        predictedConfidence += 0.2;
      } else if (transitionProbability < 0.4) {
        predictedConfidence -= 0.2;
        // Consider alternative mood
        predictedMood = this.getAlternativeMood(predictedMood, context);
      }
    }
    
    return {
      primaryMood: predictedMood,
      secondaryMoods: [predictedMood],
      intensity: predictedIntensity,
      confidence: Math.max(0, Math.min(1, predictedConfidence)),
      emotionalValence: 0.5,
      emotionalArousal: 0.5,
      emotionalDominance: 0.5,
      moodStability: 0.5,
      contextualFactors: {
        timeInfluence: 0.3,
        activityInfluence: 0.3,
        environmentInfluence: 0.2,
        socialInfluence: 0.2
      },
      moodHistory: {
        previousMoods: [],
        moodTransitions: [],
        averageMood: 'neutral',
        moodVariability: 0.5
      }
    };
  }
  
  private getAlternativeMood(originalMood: string, context: MoodContext): string {
    const alternatives: Record<string, string[]> = {
      'energetic': ['focused', 'motivated'],
      'calm': ['peaceful', 'serene'],
      'focused': ['concentrated', 'productive'],
      'happy': ['upbeat', 'cheerful'],
      'relaxed': ['calm', 'peaceful']
    };
    
    const moodAlternatives = alternatives[originalMood] || ['neutral'];
    return moodAlternatives[Math.floor(Math.random() * moodAlternatives.length)];
  }
  
  // ============================================================================
  // RECOMMENDATIONS AND INSIGHTS
  // ============================================================================
  
  private async generateMoodRecommendations(
    currentMood: MoodState,
    predictedMood: MoodState,
    context: MoodContext
  ): Promise<ContextualMoodResult['moodRecommendations']> {
    const musicSuggestions = this.getMusicSuggestions(currentMood, context);
    const moodEnhancement = this.getMoodEnhancement(currentMood, context);
    const moodStabilization = this.getMoodStabilization(currentMood, context);
    
    return {
      musicSuggestions,
      moodEnhancement,
      moodStabilization
    };
  }
  
  private getMusicSuggestions(mood: MoodState, context: MoodContext): string[] {
    const suggestions: string[] = [];
    
    // Base suggestions on primary mood
    const moodSuggestions: Record<string, string[]> = {
      'energetic': ['Upbeat pop', 'Electronic dance', 'Rock anthems'],
      'calm': ['Ambient music', 'Soft acoustic', 'Classical'],
      'focused': ['Instrumental', 'Lo-fi beats', 'Minimalist'],
      'happy': ['Pop hits', 'Folk music', 'Jazz'],
      'relaxed': ['Smooth jazz', 'Ambient', 'Nature sounds'],
      'melancholic': ['Indie folk', 'Blues', 'Slow ballads'],
      'aggressive': ['Heavy rock', 'Metal', 'Punk']
    };
    
    suggestions.push(...(moodSuggestions[mood.primaryMood] || ['General music']));
    
    // Add context-specific suggestions
    if (context.activity === 'exercising') {
      suggestions.push('High-energy workout music', 'Motivational tracks');
    } else if (context.activity === 'working') {
      suggestions.push('Background music', 'Focus playlists');
    } else if (context.environment === 'car') {
      suggestions.push('Road trip music', 'Driving playlists');
    }
    
    return suggestions;
  }
  
  private getMoodEnhancement(mood: MoodState, context: MoodContext): string[] {
    const enhancements: string[] = [];
    
    if (mood.primaryMood === 'energetic') {
      enhancements.push('Try high-tempo music', 'Listen to motivational tracks', 'Consider workout playlists');
    } else if (mood.primaryMood === 'calm') {
      enhancements.push('Try ambient music', 'Listen to nature sounds', 'Consider meditation music');
    } else if (mood.primaryMood === 'focused') {
      enhancements.push('Try instrumental music', 'Listen to lo-fi beats', 'Consider classical music');
    }
    
    return enhancements;
  }
  
  private getMoodStabilization(mood: MoodState, context: MoodContext): string[] {
    const stabilization: string[] = [];
    
    if (mood.moodStability < 0.4) {
      stabilization.push('Try consistent tempo music', 'Listen to familiar artists', 'Consider playlist continuity');
    }
    
    if (mood.intensity > 0.8) {
      stabilization.push('Try calming music', 'Listen to slower tempos', 'Consider acoustic versions');
    } else if (mood.intensity < 0.3) {
      stabilization.push('Try energizing music', 'Listen to upbeat tracks', 'Consider dance music');
    }
    
    return stabilization;
  }
  
  private async generateContextualInsights(
    moodHistory: MoodState[],
    context: MoodContext
  ): Promise<ContextualMoodResult['contextualInsights']> {
    const moodPatterns = this.analyzeMoodPatterns(moodHistory);
    const environmentalTriggers = this.identifyEnvironmentalTriggers(moodHistory, context);
    const optimalListeningTimes = this.identifyOptimalListeningTimes(moodHistory);
    const moodInfluencers = this.identifyMoodInfluencers(context);
    
    return {
      moodPatterns,
      environmentalTriggers,
      optimalListeningTimes,
      moodInfluencers
    };
  }
  
  private analyzeMoodPatterns(moodHistory: MoodState[]): string[] {
    const patterns: string[] = [];
    
    if (moodHistory.length < 2) {
      return ['Insufficient data for pattern analysis'];
    }
    
    // Analyze mood transitions
    const transitions = new Map<string, number>();
    for (let i = 1; i < moodHistory.length; i++) {
      const transition = `${moodHistory[i-1].primaryMood}->${moodHistory[i].primaryMood}`;
      transitions.set(transition, (transitions.get(transition) || 0) + 1);
    }
    
    // Find most common transitions
    const sortedTransitions = Array.from(transitions.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    sortedTransitions.forEach(([transition, count]) => {
      patterns.push(`Common mood transition: ${transition} (${count} times)`);
    });
    
    // Analyze mood stability
    const avgStability = moodHistory.reduce((sum, mood) => sum + mood.moodStability, 0) / moodHistory.length;
    if (avgStability > 0.7) {
      patterns.push('You tend to have stable mood patterns');
    } else if (avgStability < 0.4) {
      patterns.push('You tend to have variable mood patterns');
    }
    
    return patterns;
  }
  
  private identifyEnvironmentalTriggers(moodHistory: MoodState[], context: MoodContext): string[] {
    const triggers: string[] = [];
    
    // Analyze environment-mood relationships
    if (context.environment === 'gym' && moodHistory.some(m => m.primaryMood === 'energetic')) {
      triggers.push('Gym environment triggers energetic moods');
    }
    
    if (context.environment === 'home' && moodHistory.some(m => m.primaryMood === 'calm')) {
      triggers.push('Home environment promotes calm moods');
    }
    
    if (context.timeOfDay === 'morning' && moodHistory.some(m => m.primaryMood === 'energetic')) {
      triggers.push('Morning time promotes energetic moods');
    }
    
    return triggers;
  }
  
  private identifyOptimalListeningTimes(moodHistory: MoodState[]): string[] {
    const times: string[] = [];
    
    // Analyze time-based mood patterns
    const timeMoods = new Map<string, string[]>();
    moodHistory.forEach(mood => {
      // This would need time information from the mood history
      // For now, return general recommendations
    });
    
    times.push('Morning: Best for energetic music');
    times.push('Afternoon: Good for focused music');
    times.push('Evening: Ideal for relaxed music');
    times.push('Night: Perfect for calm music');
    
    return times;
  }
  
  private identifyMoodInfluencers(context: MoodContext): string[] {
    const influencers: string[] = [];
    
    if (context.activity === 'exercising') {
      influencers.push('Physical activity increases energy levels');
    }
    
    if (context.socialContext === 'with-friends') {
      influencers.push('Social interaction promotes positive moods');
    }
    
    if (context.weather === 'sunny') {
      influencers.push('Sunny weather enhances positive moods');
    } else if (context.weather === 'rainy') {
      influencers.push('Rainy weather promotes introspective moods');
    }
    
    if (context.stressLevel === 'high') {
      influencers.push('High stress levels affect mood stability');
    }
    
    return influencers;
  }
  
  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  
  private updateMoodHistory(userId: string, mood: MoodState): void {
    const history = this.moodHistory.get(userId) || [];
    history.push(mood);
    
    // Keep only last 100 mood states
    if (history.length > 100) {
      history.shift();
    }
    
    this.moodHistory.set(userId, history);
  }
  
  // Public API methods
  getMoodHistory(userId: string = 'default'): MoodState[] {
    return this.moodHistory.get(userId) || [];
  }
  
  getContextualRules(): Map<string, any> {
    return this.contextualRules;
  }
  
  getMoodTransitions(): Map<string, number> {
    return this.moodTransitions;
  }
}
