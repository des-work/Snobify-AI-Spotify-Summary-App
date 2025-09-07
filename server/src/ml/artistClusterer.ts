export interface ArtistClusteringResult {
  clusters: Array<{
    id: number;
    name: string;
    artists: Array<{
      name: string;
      similarity: number;
      genres: string[];
      avgFeatures: Record<string, number>;
    }>;
    centroid: Record<string, number>;
    size: number;
  }>;
  totalArtists: number;
  totalClusters: number;
  confidence: number;
  algorithm: string;
}

export class ArtistClusterer {
  private clusteringModel: any;

  constructor() {
    this.initializeModels();
  }

  private initializeModels() {
    console.log('Initializing artist clustering models...');
  }

  async cluster(tracks: any[]): Promise<ArtistClusteringResult> {
    console.log(`Clustering artists from ${tracks.length} tracks`);

    try {
      // Extract artist data
      const artistData = this.extractArtistData(tracks);
      const artists = Object.keys(artistData);

      if (artists.length < 2) {
        return {
          clusters: [],
          totalArtists: artists.length,
          totalClusters: 0,
          confidence: 0,
          algorithm: 'insufficient-data'
        };
      }

      // Calculate averages
      Object.values(artistData).forEach((data: any) => {
        const features = ['danceability', 'energy', 'valence', 'acousticness', 'popularity'];
        features.forEach(feature => {
          data.avgFeatures[feature] /= data.tracks.length;
        });
        data.genres = Array.from(data.genres);
      });

      // Perform clustering
      const clusters = this.performClustering(artistData);

      return {
        clusters,
        totalArtists: Object.keys(artistData).length,
        totalClusters: clusters.length,
        confidence: this.calculateClusteringConfidence(clusters),
        algorithm: 'k-means-similarity'
      };
    } catch (error) {
      console.error('Error in artist clustering:', error);
      return {
        clusters: [],
        totalArtists: 0,
        totalClusters: 0,
        confidence: 0,
        algorithm: 'error'
      };
    }
  }

  private extractArtistData(tracks: any[]): Record<string, any> {
    const artistData: Record<string, any> = {};

    tracks.forEach(track => {
      const artist = track.artistName || 'Unknown Artist';
      
      if (!artistData[artist]) {
        artistData[artist] = {
          tracks: [],
          genres: new Set(),
          avgFeatures: {
            danceability: 0,
            energy: 0,
            valence: 0,
            acousticness: 0,
            popularity: 0
          }
        };
      }

      artistData[artist].tracks.push(track);
      
      if (track.genre) {
        artistData[artist].genres.add(track.genre);
      }

      // Accumulate features
      const features = ['danceability', 'energy', 'valence', 'acousticness', 'popularity'];
      features.forEach(feature => {
        artistData[artist].avgFeatures[feature] += track[feature] || 0;
      });
    });

    return artistData;
  }

  private performClustering(artistData: Record<string, any>): Array<{
    id: number;
    name: string;
    artists: Array<{
      name: string;
      similarity: number;
      genres: string[];
      avgFeatures: Record<string, number>;
    }>;
    centroid: Record<string, number>;
    size: number;
  }> {
    const artists = Object.entries(artistData).map(([name, data]) => ({
      name,
      ...data
    }));

    // Simple clustering based on genre similarity
    const clusters: Array<{
      id: number;
      name: string;
      artists: any[];
      centroid: Record<string, number>;
      size: number;
    }> = [];

    const processedArtists = new Set<string>();
    let clusterId = 0;

    artists.forEach(artist => {
      if (processedArtists.has(artist.name)) return;

      const cluster = {
        id: clusterId++,
        name: `Cluster ${clusterId}`,
        artists: [artist],
        centroid: { ...artist.avgFeatures },
        size: 1
      };

      // Find similar artists
      artists.forEach(otherArtist => {
        if (otherArtist.name === artist.name || processedArtists.has(otherArtist.name)) return;

        const similarity = this.calculateArtistSimilarity(artist, otherArtist);
        if (similarity > 0.6) {
          cluster.artists.push(otherArtist);
          processedArtists.add(otherArtist.name);
        }
      });

      // Update centroid
      cluster.centroid = this.calculateCentroid(cluster.artists);
      cluster.size = cluster.artists.length;
      cluster.name = this.generateClusterName(cluster.artists);

      clusters.push(cluster);
      processedArtists.add(artist.name);
    });

    return clusters;
  }

  private calculateArtistSimilarity(artist1: any, artist2: any): number {
    // Genre similarity
    const genres1 = new Set(artist1.genres);
    const genres2 = new Set(artist2.genres);
    const genreIntersection = new Set([...genres1].filter(x => genres2.has(x)));
    const genreUnion = new Set([...genres1, ...genres2]);
    const genreSimilarity = genreIntersection.size / genreUnion.size;

    // Feature similarity
    const features = ['danceability', 'energy', 'valence', 'acousticness', 'popularity'];
    let featureSimilarity = 0;
    features.forEach(feature => {
      const diff = Math.abs(artist1.avgFeatures[feature] - artist2.avgFeatures[feature]);
      featureSimilarity += 1 - diff;
    });
    featureSimilarity /= features.length;

    // Combined similarity
    return (genreSimilarity * 0.6) + (featureSimilarity * 0.4);
  }

  private calculateCentroid(artists: any[]): Record<string, number> {
    const centroid: Record<string, number> = {};
    const features = ['danceability', 'energy', 'valence', 'acousticness', 'popularity'];

    features.forEach(feature => {
      centroid[feature] = artists.reduce((sum, artist) => sum + artist.avgFeatures[feature], 0) / artists.length;
    });

    return centroid;
  }

  private generateClusterName(artists: any[]): string {
    // Find most common genre
    const genreCounts: Record<string, number> = {};
    artists.forEach(artist => {
      artist.genres.forEach((genre: string) => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    });

    const topGenre = Object.entries(genreCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Mixed';

    return `${topGenre} Cluster (${artists.length} artists)`;
  }

  private calculateClusteringConfidence(clusters: any[]): number {
    if (clusters.length === 0) return 0;

    // Calculate average cluster size and cohesion
    const avgClusterSize = clusters.reduce((sum, cluster) => sum + cluster.size, 0) / clusters.length;
    
    // Confidence based on cluster distribution
    const sizeVariance = clusters.reduce((sum, cluster) => {
      return sum + Math.pow(cluster.size - avgClusterSize, 2);
    }, 0) / clusters.length;

    const normalizedVariance = Math.min(1, sizeVariance / 10);
    return Math.max(0.3, 1 - normalizedVariance);
  }
}