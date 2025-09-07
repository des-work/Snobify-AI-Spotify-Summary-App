export interface RecommendationResult {
  recommendations: Array<{
    track: string;
    artist: string;
    score: number;
    reason: string;
    similarity: number;
  }>;
  totalRecommendations: number;
  confidence: number;
  algorithm: string;
}

export class RecommendationEngine {
  private userPreferences: Record<string, number> = {};
  private trackSimilarities: Map<string, Map<string, number>> = new Map();

  constructor() {
    console.log('RecommendationEngine initialized');
  }

  async recommend(tracks: any[], limit: number = 10): Promise<RecommendationResult> {
    console.log(`Generating ${limit} recommendations from ${tracks.length} tracks`);
    
    try {
      // Analyze user preferences from listening history
      this.analyzeUserPreferences(tracks);
      
      // Generate recommendations using multiple algorithms
      const recommendations = await this.generateRecommendations(tracks, limit);
      
      return {
        recommendations,
        totalRecommendations: recommendations.length,
        confidence: this.calculateConfidence(recommendations),
        algorithm: 'hybrid-collaborative-filtering'
      };
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return {
        recommendations: [],
        totalRecommendations: 0,
        confidence: 0,
        algorithm: 'error'
      };
    }
  }

  private analyzeUserPreferences(tracks: any[]) {
    const preferences: Record<string, number> = {};
    let totalTracks = tracks.length;

    tracks.forEach(track => {
      // Analyze genre preferences
      if (track.genre) {
        preferences[`genre_${track.genre}`] = (preferences[`genre_${track.genre}`] || 0) + 1;
      }

      // Analyze audio feature preferences
      if (track.valence !== undefined) {
        preferences['prefers_high_valence'] = (preferences['prefers_high_valence'] || 0) + (track.valence > 0.5 ? 1 : 0);
      }

      if (track.energy !== undefined) {
        preferences['prefers_high_energy'] = (preferences['prefers_high_energy'] || 0) + (track.energy > 0.5 ? 1 : 0);
      }

      if (track.danceability !== undefined) {
        preferences['prefers_danceable'] = (preferences['prefers_danceable'] || 0) + (track.danceability > 0.5 ? 1 : 0);
      }

      // Analyze artist preferences
      if (track.artistName) {
        preferences[`artist_${track.artistName}`] = (preferences[`artist_${track.artistName}`] || 0) + 1;
      }

      // Analyze decade preferences
      if (track.releaseDate) {
        const year = new Date(track.releaseDate).getFullYear();
        const decade = Math.floor(year / 10) * 10;
        preferences[`decade_${decade}`] = (preferences[`decade_${decade}`] || 0) + 1;
      }
    });

    // Normalize preferences
    Object.keys(preferences).forEach(key => {
      preferences[key] = preferences[key] / totalTracks;
    });

    this.userPreferences = preferences;
    console.log('User preferences analyzed:', Object.keys(preferences).length, 'preferences found');
  }

  private async generateRecommendations(tracks: any[], limit: number) {
    const recommendations: Array<{
      track: string;
      artist: string;
      score: number;
      reason: string;
      similarity: number;
    }> = [];

    // Get unique artists from user's library
    const userArtists = [...new Set(tracks.map(t => t.artistName).filter(Boolean))];
    
    // Generate recommendations based on different strategies
    const strategies = [
      () => this.recommendBySimilarArtists(tracks, userArtists),
      () => this.recommendByAudioFeatures(tracks),
      () => this.recommendByGenre(tracks),
      () => this.recommendByDecade(tracks)
    ];

    for (const strategy of strategies) {
      try {
        const strategyRecommendations = await strategy();
        recommendations.push(...strategyRecommendations);
      } catch (error) {
        console.error('Error in recommendation strategy:', error);
      }
    }

    // Remove duplicates and sort by score
    const uniqueRecommendations = this.deduplicateRecommendations(recommendations);
    return uniqueRecommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private recommendBySimilarArtists(tracks: any[], userArtists: string[]) {
    const recommendations: any[] = [];
    
    // Find tracks by artists similar to user's favorites
    const artistScores = this.calculateArtistSimilarityScores(userArtists);
    
    Object.entries(artistScores).forEach(([artist, score]) => {
      if (score > 0.3) { // Threshold for similarity
        // Simulate finding similar tracks (in real implementation, this would query a music database)
        const mockTrack = {
          track: `Recommended Track by ${artist}`,
          artist: artist,
          score: score * 0.8,
          reason: `Similar to artists you like (${(score * 100).toFixed(1)}% similarity)`,
          similarity: score
        };
        recommendations.push(mockTrack);
      }
    });

    return recommendations;
  }

  private recommendByAudioFeatures(tracks: any[]) {
    const recommendations: any[] = [];
    
    // Calculate average audio features
    const avgFeatures = this.calculateAverageAudioFeatures(tracks);
    
    // Generate recommendations based on audio feature preferences
    const featureRecommendations = [
      {
        track: 'High Energy Recommendation',
        artist: 'Recommended Artist',
        score: avgFeatures.energy > 0.6 ? 0.9 : 0.6,
        reason: `Matches your energy preference (${(avgFeatures.energy * 100).toFixed(1)}% energy)`,
        similarity: avgFeatures.energy
      },
      {
        track: 'Danceable Track',
        artist: 'Dance Artist',
        score: avgFeatures.danceability > 0.6 ? 0.8 : 0.5,
        reason: `Matches your danceability preference (${(avgFeatures.danceability * 100).toFixed(1)}% danceable)`,
        similarity: avgFeatures.danceability
      }
    ];

    return featureRecommendations;
  }

  private recommendByGenre(tracks: any[]) {
    const recommendations: any[] = [];
    
    // Find most common genres
    const genreCounts: Record<string, number> = {};
    tracks.forEach(track => {
      if (track.genre) {
        genreCounts[track.genre] = (genreCounts[track.genre] || 0) + 1;
      }
    });

    const topGenres = Object.entries(genreCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    topGenres.forEach(([genre, count]) => {
      const score = count / tracks.length;
      recommendations.push({
        track: `Popular ${genre} Track`,
        artist: `${genre} Artist`,
        score: score * 0.7,
        reason: `Based on your ${genre} preference (${(score * 100).toFixed(1)}% of your library)`,
        similarity: score
      });
    });

    return recommendations;
  }

  private recommendByDecade(tracks: any[]) {
    const recommendations: any[] = [];
    
    // Find most common decades
    const decadeCounts: Record<string, number> = {};
    tracks.forEach(track => {
      if (track.releaseDate) {
        const year = new Date(track.releaseDate).getFullYear();
        const decade = Math.floor(year / 10) * 10;
        decadeCounts[decade.toString()] = (decadeCounts[decade.toString()] || 0) + 1;
      }
    });

    const topDecades = Object.entries(decadeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2);

    topDecades.forEach(([decade, count]) => {
      const score = count / tracks.length;
      recommendations.push({
        track: `${decade}s Classic`,
        artist: `${decade}s Artist`,
        score: score * 0.6,
        reason: `From your favorite decade (${decade}s - ${(score * 100).toFixed(1)}% of your library)`,
        similarity: score
      });
    });

    return recommendations;
  }

  private calculateArtistSimilarityScores(userArtists: string[]): Record<string, number> {
    // Mock similarity calculation (in real implementation, this would use collaborative filtering)
    const similarArtists: Record<string, number> = {};
    
    userArtists.forEach(artist => {
      // Simulate finding similar artists
      const mockSimilar = [
        { name: `${artist} Similar`, score: 0.8 },
        { name: `Related to ${artist}`, score: 0.6 },
        { name: `Inspired by ${artist}`, score: 0.4 }
      ];
      
      mockSimilar.forEach(similar => {
        similarArtists[similar.name] = Math.max(
          similarArtists[similar.name] || 0,
          similar.score
        );
      });
    });

    return similarArtists;
  }

  private calculateAverageAudioFeatures(tracks: any[]) {
    const features = {
      valence: 0,
      energy: 0,
      danceability: 0,
      acousticness: 0,
      tempo: 0
    };

    let count = 0;
    tracks.forEach(track => {
      if (track.valence !== undefined) features.valence += track.valence;
      if (track.energy !== undefined) features.energy += track.energy;
      if (track.danceability !== undefined) features.danceability += track.danceability;
      if (track.acousticness !== undefined) features.acousticness += track.acousticness;
      if (track.tempo !== undefined) features.tempo += track.tempo;
      count++;
    });

    if (count > 0) {
      features.valence /= count;
      features.energy /= count;
      features.danceability /= count;
      features.acousticness /= count;
      features.tempo /= count;
    }

    return features;
  }

  private deduplicateRecommendations(recommendations: any[]) {
    const seen = new Set<string>();
    return recommendations.filter(rec => {
      const key = `${rec.track}-${rec.artist}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private calculateConfidence(recommendations: any[]): number {
    if (recommendations.length === 0) return 0;
    
    const avgScore = recommendations.reduce((sum, rec) => sum + rec.score, 0) / recommendations.length;
    const avgSimilarity = recommendations.reduce((sum, rec) => sum + rec.similarity, 0) / recommendations.length;
    
    return Math.min(0.95, (avgScore + avgSimilarity) / 2);
  }
}
