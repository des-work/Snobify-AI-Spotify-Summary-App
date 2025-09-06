export interface ArtistClusteringResult {
    clusters: Array<{
      id: number;
      name: string;
      artists: string[];
      characteristics: string[];
      size: number;
      cohesion: number;
    }>;
    artistAssignments: Record<string, number>;
    silhouetteScore: number;
    clusterCharacteristics: Record<number, string[]>;
    recommendations: Array<{
      artist: string;
      similarArtists: string[];
      similarity: number;
    }>;
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
  
      // Extract artist data
      const artistData = this.extractArtistData(tracks);
      const artists = Object.keys(artistData);
  
      if (artists.length < 2) {
        return {
          clusters: [],
          artistAssignments: {},
          silhouetteScore: 0,
          clusterCharacteristics: {},
          recommendations: []
        };
      }
  
      // Perform clustering
      const clusters = await this.performClustering(artistData);
      const artistAssignments = this.assignArtistsToClusters(artists, clusters);
      const silhouetteScore = this.calculateSilhouetteScore(artistData, clusters, artistAssignments);
      const clusterCharacteristics = this.analyzeClusterCharacteristics(clusters, artistData);
      const recommendations = this.generateRecommendations(artistData, clusters);
  
      return {
        clusters,
        artistAssignments,
        silhouetteScore,
        clusterCharacteristics,
        recommendations
      };
    }
  
    private extractArtistData(tracks: any[]): Record<string, any> {
      const artistData: Record<string, any> = {};
  
      tracks.forEach(track => {
        const artist = track.artistName;
        if (!artist) return;
  
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
            },
            playCount: 0
          };
        }
  
        artistData[artist].tracks.push(track);
        artistData[artist].playCount++;
  
        if (track.genres) {
          track.genres.forEach((genre: string) => artistData[artist].genres.add(genre));
        }
  
        // Update average features
        const features = ['danceability', 'energy', 'valence', 'acousticness', 'popularity'];
        features.forEach(feature => {
          artistData[artist].avgFeatures[feature] += track[feature] || 0;
        });
      });
  
      // Calculate averages
      Object.values(artistData).forEach((data: any) => {
        const features = ['danceability', 'energy', 'valence', 'acousticness', 'popularity'];
        features.forEach(feature => {
          data.avgFeatures[feature] /= data.tracks.length;
        });
        data.genres = Array.from(data.genres);


