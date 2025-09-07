export interface EmotionDetail {
    name: string;
    intensity: number;
    category: string;
  }

export interface MoodPredictionResult {
    predictions: Array<{
      track: string;
      artist: string;
      mood: string;
      emotions: string[];
      emotionDetails: EmotionDetail[];
      confidence: number;
      intensity: number;
    }>;
    moodDistribution: Record<string, number>;
    emotionDistribution: Record<string, number>;
    emotionCategoryDistribution: Record<string, number>;
    dominantMood: string;
    dominantEmotion: string;
    moodTrends: Array<{
      time: string;
      mood: string;
      intensity: number;
    }>;
    confidence: number;
  }
  
  export class MoodPredictor {
    private moodModel: any;
    private emotionModel: any;
    private trainedModel: any;
    private isModelTrained: boolean = false;
  
    constructor() {
      this.initializeModels();
    }
  
    private async initializeModels() {
      console.log('Initializing mood prediction models...');
      
      // Initialize TensorFlow.js for advanced ML capabilities
      try {
        // Dynamic import to avoid build-time errors if TensorFlow is not installed
        const tf = await import('@tensorflow/tfjs-node').catch(() => {
          console.log('TensorFlow.js not available, using heuristic models only');
          return null;
        });
        
        if (tf) {
          console.log('TensorFlow.js initialized successfully');
          
          // Create a simple neural network for mood prediction
          this.trainedModel = this.createNeuralNetwork();
          console.log('Neural network model created');
        } else {
          console.log('TensorFlow.js not available, using heuristic models only');
        }
      } catch (error) {
        console.log('TensorFlow.js not available, using heuristic models only');
      }
    }

    private createNeuralNetwork() {
      // This would create a neural network model for mood prediction
      // For now, we'll return null and use the heuristic models
      return null;
    }

    async trainModel(trainingData: Array<{
      features: any;
      mood: string;
      confidence: number;
    }>) {
      console.log(`Training mood prediction model with ${trainingData.length} samples`);
      
      // For now, we'll use a simple approach to improve our heuristic models
      // In a full implementation, this would train a neural network
      
      // Analyze training data to improve our models
      const moodPatterns = this.analyzeTrainingData(trainingData);
      this.updateModelWeights(moodPatterns);
      
      this.isModelTrained = true;
      console.log('Model training completed');
    }

    private analyzeTrainingData(trainingData: Array<{
      features: any;
      mood: string;
      confidence: number;
    }>) {
      const patterns: Record<string, any> = {};
      
      trainingData.forEach(sample => {
        const { features, mood } = sample;
        
        if (!patterns[mood]) {
          patterns[mood] = {
            valence: [],
            energy: [],
            tempo: [],
            danceability: [],
            acousticness: [],
            count: 0
          };
        }
        
        patterns[mood].valence.push(features.valence);
        patterns[mood].energy.push(features.energy);
        patterns[mood].tempo.push(features.tempo);
        patterns[mood].danceability.push(features.danceability);
        patterns[mood].acousticness.push(features.acousticness);
        patterns[mood].count++;
      });
      
      // Calculate averages for each mood
      Object.keys(patterns).forEach(mood => {
        const pattern = patterns[mood];
        pattern.avgValence = pattern.valence.reduce((a: number, b: number) => a + b, 0) / pattern.count;
        pattern.avgEnergy = pattern.energy.reduce((a: number, b: number) => a + b, 0) / pattern.count;
        pattern.avgTempo = pattern.tempo.reduce((a: number, b: number) => a + b, 0) / pattern.count;
        pattern.avgDanceability = pattern.danceability.reduce((a: number, b: number) => a + b, 0) / pattern.count;
        pattern.avgAcousticness = pattern.acousticness.reduce((a: number, b: number) => a + b, 0) / pattern.count;
      });
      
      return patterns;
    }

    private updateModelWeights(patterns: Record<string, any>) {
      // Store the learned patterns for use in predictions
      this.moodModel = patterns;
      console.log('Model weights updated with learned patterns');
    }

    private getEmotionDetails(mood: string, features: any, confidence: number): EmotionDetail[] {
      const emotionMappings: Record<string, Array<{
        name: string;
        category: string;
        baseIntensity: number;
        featureMultipliers: Record<string, number>;
      }>> = {
        'Happy': [
          { name: 'Joy', category: 'Positive', baseIntensity: 0.8, featureMultipliers: { valence: 1.2, energy: 1.1 } },
          { name: 'Contentment', category: 'Positive', baseIntensity: 0.6, featureMultipliers: { valence: 1.0, acousticness: 1.1 } },
          { name: 'Optimism', category: 'Positive', baseIntensity: 0.7, featureMultipliers: { valence: 1.1, tempo: 0.9 } },
          { name: 'Cheerfulness', category: 'Positive', baseIntensity: 0.9, featureMultipliers: { danceability: 1.2, energy: 1.1 } }
        ],
        'Sad': [
          { name: 'Melancholy', category: 'Negative', baseIntensity: 0.8, featureMultipliers: { valence: -1.2, acousticness: 1.1 } },
          { name: 'Nostalgia', category: 'Reflective', baseIntensity: 0.7, featureMultipliers: { valence: -1.0, tempo: -0.8 } },
          { name: 'Longing', category: 'Negative', baseIntensity: 0.6, featureMultipliers: { valence: -1.1, energy: -0.9 } },
          { name: 'Sorrow', category: 'Negative', baseIntensity: 0.9, featureMultipliers: { valence: -1.3, energy: -1.0 } }
        ],
        'Energetic': [
          { name: 'Excitement', category: 'High-Energy', baseIntensity: 0.9, featureMultipliers: { energy: 1.3, tempo: 1.2 } },
          { name: 'Vigor', category: 'High-Energy', baseIntensity: 0.8, featureMultipliers: { energy: 1.2, danceability: 1.1 } },
          { name: 'Enthusiasm', category: 'High-Energy', baseIntensity: 0.7, featureMultipliers: { energy: 1.1, valence: 1.0 } },
          { name: 'Dynamism', category: 'High-Energy', baseIntensity: 0.8, featureMultipliers: { energy: 1.2, tempo: 1.1 } }
        ],
        'Calm': [
          { name: 'Serenity', category: 'Peaceful', baseIntensity: 0.8, featureMultipliers: { energy: -1.1, acousticness: 1.2 } },
          { name: 'Tranquility', category: 'Peaceful', baseIntensity: 0.9, featureMultipliers: { energy: -1.2, valence: 0.8 } },
          { name: 'Relaxation', category: 'Peaceful', baseIntensity: 0.7, featureMultipliers: { energy: -1.0, tempo: -0.9 } },
          { name: 'Peace', category: 'Peaceful', baseIntensity: 0.8, featureMultipliers: { energy: -1.1, acousticness: 1.1 } }
        ],
        'Angry': [
          { name: 'Frustration', category: 'Intense', baseIntensity: 0.8, featureMultipliers: { energy: 1.2, valence: -1.1 } },
          { name: 'Aggression', category: 'Intense', baseIntensity: 0.9, featureMultipliers: { energy: 1.3, tempo: 1.1 } },
          { name: 'Intensity', category: 'Intense', baseIntensity: 0.8, featureMultipliers: { energy: 1.2, danceability: 0.9 } },
          { name: 'Rebellion', category: 'Intense', baseIntensity: 0.7, featureMultipliers: { energy: 1.1, valence: -0.8 } }
        ],
        'Melancholic': [
          { name: 'Sadness', category: 'Reflective', baseIntensity: 0.8, featureMultipliers: { valence: -1.1, acousticness: 1.0 } },
          { name: 'Reflection', category: 'Reflective', baseIntensity: 0.7, featureMultipliers: { valence: -0.9, energy: -0.8 } },
          { name: 'Introspection', category: 'Reflective', baseIntensity: 0.6, featureMultipliers: { acousticness: 1.1, tempo: -0.8 } },
          { name: 'Contemplation', category: 'Reflective', baseIntensity: 0.7, featureMultipliers: { valence: -0.8, energy: -0.9 } }
        ],
        'Excited': [
          { name: 'Anticipation', category: 'High-Energy', baseIntensity: 0.8, featureMultipliers: { energy: 1.2, tempo: 1.1 } },
          { name: 'Thrill', category: 'High-Energy', baseIntensity: 0.9, featureMultipliers: { energy: 1.3, valence: 1.0 } },
          { name: 'Adrenaline', category: 'High-Energy', baseIntensity: 0.9, featureMultipliers: { energy: 1.3, tempo: 1.2 } },
          { name: 'Euphoria', category: 'High-Energy', baseIntensity: 0.8, featureMultipliers: { energy: 1.2, valence: 1.1 } }
        ],
        'Peaceful': [
          { name: 'Harmony', category: 'Peaceful', baseIntensity: 0.8, featureMultipliers: { energy: -1.0, valence: 0.9 } },
          { name: 'Balance', category: 'Peaceful', baseIntensity: 0.7, featureMultipliers: { energy: -0.9, acousticness: 1.0 } },
          { name: 'Zen', category: 'Peaceful', baseIntensity: 0.9, featureMultipliers: { energy: -1.2, acousticness: 1.2 } },
          { name: 'Meditation', category: 'Peaceful', baseIntensity: 0.8, featureMultipliers: { energy: -1.1, tempo: -1.0 } }
        ],
        'Nostalgic': [
          { name: 'Reminiscence', category: 'Reflective', baseIntensity: 0.7, featureMultipliers: { valence: -0.8, tempo: -0.9 } },
          { name: 'Sentimentality', category: 'Reflective', baseIntensity: 0.8, featureMultipliers: { valence: -0.9, acousticness: 1.0 } },
          { name: 'Yearning', category: 'Reflective', baseIntensity: 0.6, featureMultipliers: { valence: -1.0, energy: -0.8 } },
          { name: 'Memory', category: 'Reflective', baseIntensity: 0.7, featureMultipliers: { valence: -0.8, acousticness: 0.9 } }
        ],
        'Romantic': [
          { name: 'Love', category: 'Intimate', baseIntensity: 0.8, featureMultipliers: { valence: 1.1, acousticness: 1.0 } },
          { name: 'Passion', category: 'Intimate', baseIntensity: 0.9, featureMultipliers: { valence: 1.2, energy: 0.9 } },
          { name: 'Intimacy', category: 'Intimate', baseIntensity: 0.7, featureMultipliers: { valence: 1.0, energy: -0.8 } },
          { name: 'Affection', category: 'Intimate', baseIntensity: 0.8, featureMultipliers: { valence: 1.1, acousticness: 1.1 } }
        ]
      };

      const moodEmotions = emotionMappings[mood] || [];
      const emotionDetails: EmotionDetail[] = [];

      moodEmotions.forEach(emotion => {
        let intensity = emotion.baseIntensity;
        
        // Apply feature multipliers
        Object.entries(emotion.featureMultipliers).forEach(([feature, multiplier]) => {
          const featureValue = features[feature] || 0.5;
          intensity *= (1 + (featureValue - 0.5) * multiplier * 0.5);
        });

        // Adjust intensity based on confidence
        intensity *= confidence;

        // Clamp intensity between 0 and 1
        intensity = Math.max(0, Math.min(1, intensity));

        emotionDetails.push({
          name: emotion.name,
          intensity,
          category: emotion.category
        });
      });

      // Sort by intensity and return top 3
      return emotionDetails
        .sort((a, b) => b.intensity - a.intensity)
        .slice(0, 3);
    }
  
    async predict(tracks: any[]): Promise<MoodPredictionResult> {
      console.log(`Predicting moods for ${tracks.length} tracks`);
  
      const predictions = [];
      const moodCounts: Record<string, number> = {};
      const emotionCounts: Record<string, number> = {};
      const emotionCategoryCounts: Record<string, number> = {};

      for (const track of tracks.slice(0, 1000)) {
        const prediction = await this.predictTrackMood(track);
        predictions.push(prediction);

        moodCounts[prediction.mood] = (moodCounts[prediction.mood] || 0) + 1;
        prediction.emotions.forEach(emotion => {
          emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        });
        prediction.emotionDetails.forEach(emotion => {
          emotionCategoryCounts[emotion.category] = (emotionCategoryCounts[emotion.category] || 0) + 1;
        });
      }

      const dominantMood = Object.entries(moodCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';

      const dominantEmotion = Object.entries(emotionCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';

      const moodTrends = this.analyzeMoodTrends(tracks);

      const confidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;

      return {
        predictions,
        moodDistribution: moodCounts,
        emotionDistribution: emotionCounts,
        emotionCategoryDistribution: emotionCategoryCounts,
        dominantMood,
        dominantEmotion,
        moodTrends,
        confidence
      };
    }
  
    private async predictTrackMood(track: any): Promise<{
      track: string;
      artist: string;
      mood: string;
      emotions: string[];
      emotionDetails: EmotionDetail[];
      confidence: number;
      intensity: number;
    }> {
      const audioFeatures = this.extractAudioFeatures(track);
      const metadata = this.extractMetadata(track);
  
      // Use multiple models for mood prediction
      const modelPromises = [
        this.predictMoodModel1(audioFeatures, metadata),
        this.predictMoodModel2(audioFeatures, metadata),
        this.predictMoodModel3(audioFeatures, metadata)
      ];

      // Add trained model if available
      if (this.isModelTrained && this.moodModel) {
        modelPromises.push(this.predictMoodModel4(audioFeatures, metadata));
      }

      const predictions = await Promise.all(modelPromises);
  
      // Enhanced ensemble voting with weighted confidence
      const ensembleResult = this.combinePredictions(predictions);
      
      // Get detailed emotion analysis
      const emotionDetails = this.getEmotionDetails(ensembleResult.mood, audioFeatures, ensembleResult.confidence);
      
      // Calculate overall intensity based on energy and confidence
      const intensity = Math.min(1, (audioFeatures.energy * 0.7 + ensembleResult.confidence * 0.3));
  
      return {
        track: track.trackName || 'Unknown',
        artist: track.artistName || 'Unknown',
        mood: ensembleResult.mood,
        emotions: ensembleResult.emotions,
        emotionDetails,
        confidence: ensembleResult.confidence,
        intensity
      };
    }
  
    private extractAudioFeatures(track: any) {
      return {
        valence: track.valence || 0,
        energy: track.energy || 0,
        danceability: track.danceability || 0,
        acousticness: track.acousticness || 0,
        tempo: track.tempo || 120
      };
    }
  
    private extractMetadata(track: any) {
      return {
        popularity: track.popularity || 0,
        releaseYear: this.extractYear(track.releaseDate),
        duration: track.duration || 180000
      };
    }
  
    private extractYear(releaseDate: string): number {
      if (!releaseDate) return 2020;
      const year = new Date(releaseDate).getFullYear();
      return isNaN(year) ? 2020 : year;
    }
  
    private async predictMoodModel1(features: any, metadata: any) {
      // Model 1: Advanced valence-energy matrix with tempo consideration
      const moods = ['Happy', 'Sad', 'Energetic', 'Calm', 'Angry', 'Melancholic', 'Excited', 'Peaceful', 'Nostalgic', 'Romantic'];
      const emotions: Record<string, string[]> = {
        'Happy': ['Joy', 'Contentment', 'Optimism', 'Cheerfulness'],
        'Sad': ['Melancholy', 'Nostalgia', 'Longing', 'Sorrow'],
        'Energetic': ['Excitement', 'Vigor', 'Enthusiasm', 'Dynamism'],
        'Calm': ['Serenity', 'Tranquility', 'Relaxation', 'Peace'],
        'Angry': ['Frustration', 'Aggression', 'Intensity', 'Rebellion'],
        'Melancholic': ['Sadness', 'Reflection', 'Introspection', 'Contemplation'],
        'Excited': ['Anticipation', 'Thrill', 'Adrenaline', 'Euphoria'],
        'Peaceful': ['Harmony', 'Balance', 'Zen', 'Meditation'],
        'Nostalgic': ['Reminiscence', 'Sentimentality', 'Yearning', 'Memory'],
        'Romantic': ['Love', 'Passion', 'Intimacy', 'Affection']
      };

      // Advanced mood classification using multiple features
      let mood = 'Happy';
      let confidence = 0.5;

      // Valence-Energy matrix with tempo influence
      const valence = features.valence;
      const energy = features.energy;
      const tempo = features.tempo;
      const danceability = features.danceability;
      const acousticness = features.acousticness;

      // High valence, high energy
      if (valence > 0.7 && energy > 0.7) {
        if (tempo > 140) {
          mood = 'Excited';
          confidence = 0.85;
        } else if (danceability > 0.7) {
          mood = 'Energetic';
          confidence = 0.8;
        } else {
          mood = 'Happy';
          confidence = 0.75;
        }
      }
      // High valence, low energy
      else if (valence > 0.7 && energy < 0.4) {
        if (acousticness > 0.6) {
          mood = 'Peaceful';
          confidence = 0.8;
        } else if (tempo < 80) {
          mood = 'Romantic';
          confidence = 0.75;
        } else {
          mood = 'Calm';
          confidence = 0.7;
        }
      }
      // Low valence, high energy
      else if (valence < 0.3 && energy > 0.6) {
        if (tempo > 120) {
          mood = 'Angry';
          confidence = 0.8;
        } else {
          mood = 'Energetic';
          confidence = 0.7;
        }
      }
      // Low valence, low energy
      else if (valence < 0.3 && energy < 0.4) {
        if (acousticness > 0.5) {
          mood = 'Melancholic';
          confidence = 0.85;
        } else if (tempo < 70) {
          mood = 'Nostalgic';
          confidence = 0.8;
        } else {
          mood = 'Sad';
          confidence = 0.75;
        }
      }
      // Medium ranges - more nuanced classification
      else if (valence > 0.4 && valence < 0.7 && energy > 0.4 && energy < 0.7) {
        if (danceability > 0.6) {
          mood = 'Happy';
          confidence = 0.7;
        } else if (acousticness > 0.5) {
          mood = 'Peaceful';
          confidence = 0.65;
        } else {
          mood = 'Calm';
          confidence = 0.6;
        }
      }
      // Edge cases
      else {
        mood = valence > 0.5 ? 'Happy' : 'Sad';
        confidence = 0.5;
      }

      // Adjust confidence based on feature consistency
      const featureConsistency = this.calculateFeatureConsistency(features);
      confidence = Math.min(0.95, confidence + featureConsistency * 0.1);
  
      return {
        mood,
        emotions: emotions[mood] || ['Neutral'],
        confidence
      };
    }
  
    private async predictMoodModel2(features: any, metadata: any) {
      // Model 2: Tempo and rhythm-based mood prediction
      const moods = ['Happy', 'Sad', 'Energetic', 'Calm', 'Angry', 'Melancholic', 'Excited', 'Peaceful', 'Nostalgic', 'Romantic'];
      const emotions: Record<string, string[]> = {
        'Happy': ['Upbeat', 'Cheerful', 'Positive'],
        'Sad': ['Melancholic', 'Somber', 'Reflective'],
        'Energetic': ['Dynamic', 'Vibrant', 'Active'],
        'Calm': ['Gentle', 'Smooth', 'Relaxed'],
        'Angry': ['Intense', 'Aggressive', 'Powerful'],
        'Melancholic': ['Thoughtful', 'Contemplative', 'Deep'],
        'Excited': ['Thrilling', 'Adrenaline', 'High-energy'],
        'Peaceful': ['Tranquil', 'Serene', 'Meditative'],
        'Nostalgic': ['Sentimental', 'Wistful', 'Reminiscent'],
        'Romantic': ['Intimate', 'Passionate', 'Loving']
      };

      let mood = 'Calm';
      let confidence = 0.5;

      const { energy, tempo, danceability, acousticness, valence } = features;
      const { duration, popularity } = metadata;

      // Tempo-based classification with energy consideration
      if (tempo > 160) {
        if (energy > 0.8) {
          mood = 'Excited';
          confidence = 0.9;
        } else {
          mood = 'Energetic';
          confidence = 0.8;
        }
      } else if (tempo > 120) {
        if (energy > 0.7) {
          mood = 'Energetic';
          confidence = 0.85;
        } else if (danceability > 0.7) {
          mood = 'Happy';
          confidence = 0.8;
        } else {
          mood = valence > 0.5 ? 'Happy' : 'Melancholic';
          confidence = 0.7;
        }
      } else if (tempo > 80) {
        if (acousticness > 0.6) {
          mood = 'Peaceful';
          confidence = 0.8;
        } else if (valence > 0.6) {
          mood = 'Happy';
          confidence = 0.75;
        } else if (valence < 0.4) {
          mood = 'Sad';
          confidence = 0.75;
        } else {
          mood = 'Calm';
          confidence = 0.7;
        }
      } else {
        // Slow tempo
        if (acousticness > 0.7) {
          mood = 'Peaceful';
          confidence = 0.85;
        } else if (valence > 0.6) {
          mood = 'Romantic';
          confidence = 0.8;
        } else if (valence < 0.4) {
          mood = 'Nostalgic';
          confidence = 0.8;
        } else {
          mood = 'Melancholic';
          confidence = 0.75;
        }
      }

      // Adjust based on duration (longer songs might be more contemplative)
      if (duration > 300000) { // 5+ minutes
        if (mood === 'Happy') mood = 'Peaceful';
        if (mood === 'Energetic') mood = 'Melancholic';
        confidence += 0.05;
      }

      // Adjust based on popularity (mainstream vs niche)
      if (popularity < 30) {
        // Less popular songs might be more niche/artistic
        if (mood === 'Happy') mood = 'Melancholic';
        if (mood === 'Energetic') mood = 'Angry';
        confidence += 0.03;
      }
  
      return {
        mood,
        emotions: emotions[mood] || ['Musical expression'],
        confidence: Math.min(0.95, confidence)
      };
    }
  
    private async predictMoodModel3(features: any, metadata: any) {
      // Model 3: Multi-dimensional feature analysis with weighted scoring
      const moods = ['Happy', 'Sad', 'Energetic', 'Calm', 'Angry', 'Melancholic', 'Excited', 'Peaceful', 'Nostalgic', 'Romantic'];
      const emotions: Record<string, string[]> = {
        'Happy': ['Joyful', 'Optimistic', 'Bright'],
        'Sad': ['Melancholic', 'Bittersweet', 'Emotional'],
        'Energetic': ['Vibrant', 'Dynamic', 'Powerful'],
        'Calm': ['Serene', 'Balanced', 'Composed'],
        'Angry': ['Intense', 'Aggressive', 'Rebellious'],
        'Melancholic': ['Contemplative', 'Deep', 'Thoughtful'],
        'Excited': ['Thrilling', 'Adrenaline', 'Electric'],
        'Peaceful': ['Tranquil', 'Harmonious', 'Zen'],
        'Nostalgic': ['Sentimental', 'Wistful', 'Memorable'],
        'Romantic': ['Passionate', 'Intimate', 'Loving']
      };

      // Calculate weighted scores for each mood
      const moodScores: Record<string, number> = {};
      
      const { valence, energy, danceability, acousticness, tempo } = features;
      const { duration, popularity, releaseYear } = metadata;

      // Initialize all mood scores
      moods.forEach(mood => moodScores[mood] = 0);

      // Valence-based scoring
      if (valence > 0.7) {
        moodScores['Happy'] += 3;
        moodScores['Excited'] += 2;
        moodScores['Romantic'] += 1;
      } else if (valence < 0.3) {
        moodScores['Sad'] += 3;
        moodScores['Melancholic'] += 2;
        moodScores['Nostalgic'] += 1;
      } else {
        moodScores['Calm'] += 2;
        moodScores['Peaceful'] += 1;
      }

      // Energy-based scoring
      if (energy > 0.8) {
        moodScores['Excited'] += 3;
        moodScores['Energetic'] += 2;
        moodScores['Angry'] += 1;
      } else if (energy < 0.3) {
        moodScores['Peaceful'] += 3;
        moodScores['Calm'] += 2;
        moodScores['Melancholic'] += 1;
      } else {
        moodScores['Happy'] += 1;
        moodScores['Romantic'] += 1;
      }

      // Tempo-based scoring
      if (tempo > 140) {
        moodScores['Excited'] += 2;
        moodScores['Energetic'] += 2;
      } else if (tempo < 70) {
        moodScores['Peaceful'] += 2;
        moodScores['Melancholic'] += 2;
        moodScores['Nostalgic'] += 1;
      }

      // Danceability-based scoring
      if (danceability > 0.7) {
        moodScores['Happy'] += 2;
        moodScores['Energetic'] += 1;
      } else if (danceability < 0.3) {
        moodScores['Melancholic'] += 2;
        moodScores['Peaceful'] += 1;
      }

      // Acousticness-based scoring
      if (acousticness > 0.7) {
        moodScores['Peaceful'] += 2;
        moodScores['Romantic'] += 2;
        moodScores['Melancholic'] += 1;
      } else if (acousticness < 0.3) {
        moodScores['Energetic'] += 2;
        moodScores['Excited'] += 1;
      }

      // Duration-based adjustments
      if (duration > 300000) { // 5+ minutes
        moodScores['Melancholic'] += 1;
        moodScores['Peaceful'] += 1;
        moodScores['Nostalgic'] += 1;
      }

      // Popularity-based adjustments
      if (popularity < 30) {
        moodScores['Melancholic'] += 1;
        moodScores['Angry'] += 1;
      } else if (popularity > 70) {
        moodScores['Happy'] += 1;
        moodScores['Energetic'] += 1;
      }

      // Release year-based adjustments (older songs might be more nostalgic)
      if (releaseYear < 2000) {
        moodScores['Nostalgic'] += 1;
        moodScores['Melancholic'] += 1;
      }

      // Find the mood with the highest score
      const bestMood = Object.entries(moodScores)
        .sort(([,a], [,b]) => b - a)[0][0];

      // Calculate confidence based on score distribution
      const maxScore = moodScores[bestMood];
      const totalScore = Object.values(moodScores).reduce((sum, score) => sum + score, 0);
      const confidence = totalScore > 0 ? Math.min(0.95, 0.6 + (maxScore / totalScore) * 0.3) : 0.5;
      
      return {
        mood: bestMood,
        emotions: emotions[bestMood] || ['Musical expression'],
        confidence
      };
    }

    private async predictMoodModel4(features: any, metadata: any) {
      // Model 4: Data-driven model using learned patterns
      if (!this.moodModel) {
        return {
          mood: 'Unknown',
          emotions: ['No training data'],
          confidence: 0.1
        };
      }

      const emotions: Record<string, string[]> = {
        'Happy': ['Learned Joy', 'Data-driven Positivity'],
        'Sad': ['Learned Melancholy', 'Data-driven Sorrow'],
        'Energetic': ['Learned Energy', 'Data-driven Dynamism'],
        'Calm': ['Learned Serenity', 'Data-driven Peace'],
        'Angry': ['Learned Intensity', 'Data-driven Aggression'],
        'Melancholic': ['Learned Contemplation', 'Data-driven Reflection'],
        'Excited': ['Learned Thrill', 'Data-driven Adrenaline'],
        'Peaceful': ['Learned Tranquility', 'Data-driven Zen'],
        'Nostalgic': ['Learned Sentiment', 'Data-driven Memory'],
        'Romantic': ['Learned Passion', 'Data-driven Love']
      };

      // Calculate similarity to learned patterns
      const similarities: Record<string, number> = {};
      
      Object.keys(this.moodModel).forEach(mood => {
        const pattern = this.moodModel[mood];
        
        // Calculate weighted distance from learned pattern
        const valenceDiff = Math.abs(features.valence - pattern.avgValence);
        const energyDiff = Math.abs(features.energy - pattern.avgEnergy);
        const tempoDiff = Math.abs(features.tempo - pattern.avgTempo) / 200; // Normalize tempo
        const danceabilityDiff = Math.abs(features.danceability - pattern.avgDanceability);
        const acousticnessDiff = Math.abs(features.acousticness - pattern.avgAcousticness);
        
        // Weighted similarity score (lower distance = higher similarity)
        const distance = (valenceDiff * 0.3) + (energyDiff * 0.3) + (tempoDiff * 0.2) + 
                        (danceabilityDiff * 0.1) + (acousticnessDiff * 0.1);
        
        similarities[mood] = Math.max(0, 1 - distance);
      });

      // Find the mood with highest similarity
      const bestMood = Object.entries(similarities)
        .sort(([,a], [,b]) => b - a)[0][0];

      const confidence = Math.min(0.95, similarities[bestMood] * 1.2);

      return {
        mood: bestMood,
        emotions: emotions[bestMood] || ['Data-driven prediction'],
        confidence
      };
    }
  
    private analyzeMoodTrends(tracks: any[]): Array<{time: string, mood: string, intensity: number}> {
      // Analyze mood trends over time
      const trends = [];
      const timeGroups = this.groupTracksByTime(tracks);
  
      for (const [time, tracks] of Object.entries(timeGroups)) {
        const avgValence = tracks.reduce((sum, t) => sum + (t.valence || 0), 0) / tracks.length;
        const avgEnergy = tracks.reduce((sum, t) => sum + (t.energy || 0), 0) / tracks.length;
        
        let mood = 'Neutral';
        if (avgValence > 0.6) mood = 'Positive';
        else if (avgValence < 0.4) mood = 'Negative';
        
        trends.push({
          time,
          mood,
          intensity: avgEnergy
        });
      }
  
      return trends;
    }
  
    private groupTracksByTime(tracks: any[]): Record<string, any[]> {
      const groups: Record<string, any[]> = {};
      
      tracks.forEach(track => {
        const date = new Date(track.playedAt || track.addedAt || '');
        if (!isNaN(date.getTime())) {
          const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (!groups[month]) groups[month] = [];
          groups[month].push(track);
        }
      });
  
      return groups;
    }

    private calculateFeatureConsistency(features: any): number {
      // Calculate how consistent the audio features are with each other
      // Higher consistency means more reliable mood prediction
      const { valence, energy, danceability, acousticness, tempo } = features;
      
      let consistency = 0;
      let checks = 0;

      // Valence-Energy consistency
      if ((valence > 0.6 && energy > 0.5) || (valence < 0.4 && energy < 0.5)) {
        consistency += 1;
      }
      checks++;

      // Danceability-Energy consistency
      if ((danceability > 0.6 && energy > 0.5) || (danceability < 0.4 && energy < 0.5)) {
        consistency += 1;
      }
      checks++;

      // Acousticness-Energy consistency (inverse relationship)
      if ((acousticness > 0.6 && energy < 0.5) || (acousticness < 0.4 && energy > 0.5)) {
        consistency += 1;
      }
      checks++;

      // Tempo-Energy consistency
      if ((tempo > 120 && energy > 0.6) || (tempo < 80 && energy < 0.4)) {
        consistency += 1;
      }
      checks++;

      return checks > 0 ? consistency / checks : 0.5;
    }

    private combinePredictions(predictions: Array<{
      mood: string;
      emotions: string[];
      confidence: number;
    }>): {
      mood: string;
      emotions: string[];
      confidence: number;
    } {
      // Weighted voting system based on confidence scores
      const moodVotes: Record<string, number> = {};
      const emotionVotes: Record<string, number> = {};
      let totalConfidence = 0;

      // Collect votes from all models
      predictions.forEach((prediction, index) => {
        const weight = prediction.confidence;
        totalConfidence += weight;

        // Vote for mood
        moodVotes[prediction.mood] = (moodVotes[prediction.mood] || 0) + weight;

        // Vote for emotions
        prediction.emotions.forEach(emotion => {
          emotionVotes[emotion] = (emotionVotes[emotion] || 0) + weight;
        });
      });

      // Find the mood with the highest weighted vote
      const bestMood = Object.entries(moodVotes)
        .sort(([,a], [,b]) => b - a)[0][0];

      // Find the top emotions
      const topEmotions = Object.entries(emotionVotes)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([emotion]) => emotion);

      // Calculate ensemble confidence
      const moodConfidence = moodVotes[bestMood] / totalConfidence;
      const avgConfidence = totalConfidence / predictions.length;
      const ensembleConfidence = Math.min(0.95, (moodConfidence + avgConfidence) / 2);

      return {
        mood: bestMood,
        emotions: topEmotions.length > 0 ? topEmotions : ['Musical expression'],
        confidence: ensembleConfidence
      };
    }
  }


