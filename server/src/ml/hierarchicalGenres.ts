// ============================================================================
// HIERARCHICAL GENRE CLASSIFICATION SYSTEM
// ============================================================================

export interface GenreNode {
  id: string;
  name: string;
  level: number; // 0 = root, 1 = main genre, 2 = sub-genre, 3 = micro-genre
  parent?: string;
  children: string[];
  features: {
    energy: [number, number]; // [min, max]
    valence: [number, number];
    danceability: [number, number];
    acousticness: [number, number];
    tempo: [number, number];
    complexity: number; // 0-1 scale
    popularity: number; // 0-1 scale
  };
  keywords: string[];
  similarGenres: string[];
  fusionGenres: string[];
}

export interface GenreClassificationResult {
  primaryGenre: GenreNode;
  subGenres: GenreNode[];
  microGenres: GenreNode[];
  confidence: number;
  fusionDetected: boolean;
  fusionGenres: GenreNode[];
  genreComplexity: number;
  genreEvolution: {
    era: string;
    influences: string[];
    modernVariants: string[];
  };
}

export class HierarchicalGenreClassifier {
  private genreTree: Map<string, GenreNode> = new Map();
  private genreFeatures: Map<string, number[]> = new Map();
  private fusionPatterns: Map<string, string[]> = new Map();
  
  constructor() {
    this.initializeGenreHierarchy();
    this.initializeFusionPatterns();
  }
  
  private initializeGenreHierarchy(): void {
    // Level 0: Root
    this.addGenreNode({
      id: 'root',
      name: 'Music',
      level: 0,
      children: ['popular', 'classical', 'world', 'experimental'],
      features: { energy: [0, 1], valence: [0, 1], danceability: [0, 1], acousticness: [0, 1], tempo: [60, 200], complexity: 0.5, popularity: 0.5 },
      keywords: ['music', 'sound', 'audio'],
      similarGenres: [],
      fusionGenres: []
    });
    
    // Level 1: Main Genres
    this.addGenreNode({
      id: 'popular',
      name: 'Popular Music',
      level: 1,
      parent: 'root',
      children: ['pop', 'rock', 'hip-hop', 'electronic', 'r&b', 'country'],
      features: { energy: [0.3, 0.9], valence: [0.2, 0.8], danceability: [0.4, 0.9], acousticness: [0.1, 0.7], tempo: [80, 180], complexity: 0.4, popularity: 0.8 },
      keywords: ['popular', 'mainstream', 'commercial'],
      similarGenres: ['rock', 'pop'],
      fusionGenres: ['pop-rock', 'hip-hop-pop']
    });
    
    this.addGenreNode({
      id: 'classical',
      name: 'Classical Music',
      level: 1,
      parent: 'root',
      children: ['baroque', 'romantic', 'modern-classical', 'chamber'],
      features: { energy: [0.1, 0.6], valence: [0.1, 0.7], danceability: [0.1, 0.4], acousticness: [0.8, 1.0], tempo: [40, 160], complexity: 0.9, popularity: 0.2 },
      keywords: ['classical', 'orchestral', 'symphony'],
      similarGenres: ['jazz', 'world'],
      fusionGenres: ['neo-classical', 'classical-crossover']
    });
    
    this.addGenreNode({
      id: 'world',
      name: 'World Music',
      level: 1,
      parent: 'root',
      children: ['african', 'latin', 'asian', 'folk'],
      features: { energy: [0.2, 0.8], valence: [0.3, 0.8], danceability: [0.3, 0.8], acousticness: [0.6, 1.0], tempo: [60, 140], complexity: 0.6, popularity: 0.3 },
      keywords: ['world', 'ethnic', 'traditional'],
      similarGenres: ['folk', 'classical'],
      fusionGenres: ['world-fusion', 'ethnic-pop']
    });
    
    this.addGenreNode({
      id: 'experimental',
      name: 'Experimental Music',
      level: 1,
      parent: 'root',
      children: ['avant-garde', 'noise', 'ambient', 'drone'],
      features: { energy: [0.0, 0.7], valence: [0.0, 0.6], danceability: [0.0, 0.5], acousticness: [0.3, 1.0], tempo: [20, 120], complexity: 0.95, popularity: 0.1 },
      keywords: ['experimental', 'avant-garde', 'unconventional'],
      similarGenres: ['ambient', 'electronic'],
      fusionGenres: ['experimental-pop', 'avant-garde-jazz']
    });
    
    // Level 2: Sub-genres
    this.addGenreNode({
      id: 'pop',
      name: 'Pop',
      level: 2,
      parent: 'popular',
      children: ['synthpop', 'indie-pop', 'electropop', 'pop-rock'],
      features: { energy: [0.5, 0.9], valence: [0.4, 0.9], danceability: [0.6, 0.9], acousticness: [0.1, 0.5], tempo: [100, 140], complexity: 0.3, popularity: 0.9 },
      keywords: ['pop', 'catchy', 'melodic', 'commercial'],
      similarGenres: ['rock', 'r&b'],
      fusionGenres: ['pop-rock', 'pop-hip-hop']
    });
    
    this.addGenreNode({
      id: 'rock',
      name: 'Rock',
      level: 2,
      parent: 'popular',
      children: ['alternative-rock', 'indie-rock', 'progressive-rock', 'punk-rock'],
      features: { energy: [0.6, 0.95], valence: [0.2, 0.8], danceability: [0.4, 0.8], acousticness: [0.1, 0.6], tempo: [80, 160], complexity: 0.5, popularity: 0.7 },
      keywords: ['rock', 'guitar', 'drums', 'electric'],
      similarGenres: ['pop', 'metal'],
      fusionGenres: ['pop-rock', 'rock-hip-hop']
    });
    
    this.addGenreNode({
      id: 'hip-hop',
      name: 'Hip-Hop',
      level: 2,
      parent: 'popular',
      children: ['trap', 'conscious-rap', 'old-school', 'drill'],
      features: { energy: [0.4, 0.9], valence: [0.1, 0.7], danceability: [0.7, 0.95], acousticness: [0.0, 0.3], tempo: [70, 140], complexity: 0.4, popularity: 0.8 },
      keywords: ['hip-hop', 'rap', 'beats', 'rhythm'],
      similarGenres: ['r&b', 'electronic'],
      fusionGenres: ['hip-hop-pop', 'trap-pop']
    });
    
    this.addGenreNode({
      id: 'electronic',
      name: 'Electronic',
      level: 2,
      parent: 'popular',
      children: ['house', 'techno', 'ambient', 'dubstep'],
      features: { energy: [0.3, 0.95], valence: [0.2, 0.8], danceability: [0.6, 0.95], acousticness: [0.0, 0.4], tempo: [100, 180], complexity: 0.6, popularity: 0.6 },
      keywords: ['electronic', 'synthesizer', 'digital', 'beats'],
      similarGenres: ['hip-hop', 'pop'],
      fusionGenres: ['electro-pop', 'trap-electronic']
    });
    
    // Level 3: Micro-genres
    this.addGenreNode({
      id: 'synthpop',
      name: 'Synthpop',
      level: 3,
      parent: 'pop',
      children: [],
      features: { energy: [0.6, 0.8], valence: [0.5, 0.8], danceability: [0.7, 0.9], acousticness: [0.0, 0.2], tempo: [110, 130], complexity: 0.4, popularity: 0.6 },
      keywords: ['synthpop', 'synthesizer', '80s', 'new-wave'],
      similarGenres: ['electropop', 'new-wave'],
      fusionGenres: ['synthwave', 'retro-pop']
    });
    
    this.addGenreNode({
      id: 'trap',
      name: 'Trap',
      level: 3,
      parent: 'hip-hop',
      children: [],
      features: { energy: [0.5, 0.9], valence: [0.1, 0.6], danceability: [0.8, 0.95], acousticness: [0.0, 0.2], tempo: [65, 75], complexity: 0.3, popularity: 0.8 },
      keywords: ['trap', '808', 'hi-hats', 'bass'],
      similarGenres: ['drill', 'hip-hop'],
      fusionGenres: ['trap-pop', 'trap-electronic']
    });
    
    this.addGenreNode({
      id: 'house',
      name: 'House',
      level: 3,
      parent: 'electronic',
      children: [],
      features: { energy: [0.7, 0.9], valence: [0.6, 0.9], danceability: [0.8, 0.95], acousticness: [0.0, 0.3], tempo: [120, 130], complexity: 0.5, popularity: 0.7 },
      keywords: ['house', '4/4', 'disco', 'dance'],
      similarGenres: ['techno', 'disco'],
      fusionGenres: ['deep-house', 'progressive-house']
    });
  }
  
  private initializeFusionPatterns(): void {
    this.fusionPatterns.set('pop-rock', ['pop', 'rock']);
    this.fusionPatterns.set('hip-hop-pop', ['hip-hop', 'pop']);
    this.fusionPatterns.set('trap-pop', ['trap', 'pop']);
    this.fusionPatterns.set('electro-pop', ['electronic', 'pop']);
    this.fusionPatterns.set('neo-classical', ['classical', 'electronic']);
    this.fusionPatterns.set('world-fusion', ['world', 'pop']);
    this.fusionPatterns.set('experimental-pop', ['experimental', 'pop']);
    this.fusionPatterns.set('synthwave', ['synthpop', 'electronic']);
    this.fusionPatterns.set('deep-house', ['house', 'ambient']);
    this.fusionPatterns.set('progressive-house', ['house', 'progressive-rock']);
  }
  
  private addGenreNode(node: GenreNode): void {
    this.genreTree.set(node.id, node);
  }
  
  // ============================================================================
  // HIERARCHICAL CLASSIFICATION
  // ============================================================================
  
  async classifyHierarchical(features: any): Promise<GenreClassificationResult> {
    console.log('Starting hierarchical genre classification...');
    
    // Level 1: Classify main genre
    const mainGenre = await this.classifyMainGenre(features);
    
    // Level 2: Classify sub-genre
    const subGenres = await this.classifySubGenres(features, mainGenre);
    
    // Level 3: Classify micro-genres
    const microGenres = await this.classifyMicroGenres(features, subGenres);
    
    // Detect fusion genres
    const fusionGenres = await this.detectFusionGenres(features, mainGenre, subGenres);
    
    // Calculate overall confidence
    const confidence = this.calculateOverallConfidence(mainGenre, subGenres, microGenres);
    
    // Calculate genre complexity
    const genreComplexity = this.calculateGenreComplexity(mainGenre, subGenres, microGenres);
    
    // Analyze genre evolution
    const genreEvolution = this.analyzeGenreEvolution(mainGenre, subGenres);
    
    return {
      primaryGenre: mainGenre,
      subGenres,
      microGenres,
      confidence,
      fusionDetected: fusionGenres.length > 0,
      fusionGenres,
      genreComplexity,
      genreEvolution
    };
  }
  
  private async classifyMainGenre(features: any): Promise<GenreNode> {
    const mainGenres = ['popular', 'classical', 'world', 'experimental'];
    let bestGenre = mainGenres[0];
    let bestScore = 0;
    
    for (const genreId of mainGenres) {
      const genre = this.genreTree.get(genreId)!;
      const score = this.calculateGenreMatch(features, genre);
      
      if (score > bestScore) {
        bestScore = score;
        bestGenre = genreId;
      }
    }
    
    return this.genreTree.get(bestGenre)!;
  }
  
  private async classifySubGenres(features: any, mainGenre: GenreNode): Promise<GenreNode[]> {
    const subGenres: GenreNode[] = [];
    
    for (const childId of mainGenre.children) {
      const child = this.genreTree.get(childId);
      if (child && child.level === 2) {
        const score = this.calculateGenreMatch(features, child);
        if (score > 0.6) { // Threshold for sub-genre inclusion
          subGenres.push(child);
        }
      }
    }
    
    // Sort by match score
    subGenres.sort((a, b) => {
      const scoreA = this.calculateGenreMatch(features, a);
      const scoreB = this.calculateGenreMatch(features, b);
      return scoreB - scoreA;
    });
    
    return subGenres.slice(0, 3); // Return top 3 sub-genres
  }
  
  private async classifyMicroGenres(features: any, subGenres: GenreNode[]): Promise<GenreNode[]> {
    const microGenres: GenreNode[] = [];
    
    for (const subGenre of subGenres) {
      for (const childId of subGenre.children) {
        const child = this.genreTree.get(childId);
        if (child && child.level === 3) {
          const score = this.calculateGenreMatch(features, child);
          if (score > 0.7) { // Higher threshold for micro-genre
            microGenres.push(child);
          }
        }
      }
    }
    
    // Sort by match score
    microGenres.sort((a, b) => {
      const scoreA = this.calculateGenreMatch(features, a);
      const scoreB = this.calculateGenreMatch(features, b);
      return scoreB - scoreA;
    });
    
    return microGenres.slice(0, 2); // Return top 2 micro-genres
  }
  
  private async detectFusionGenres(features: any, mainGenre: GenreNode, subGenres: GenreNode[]): Promise<GenreNode[]> {
    const fusionGenres: GenreNode[] = [];
    
    // Check for fusion patterns
    for (const [fusionName, components] of this.fusionPatterns) {
      const matchScore = this.calculateFusionMatch(features, components);
      if (matchScore > 0.7) {
        // Create fusion genre node
        const fusionGenre: GenreNode = {
          id: fusionName,
          name: fusionName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          level: 2.5, // Between sub-genre and micro-genre
          children: [],
          features: this.calculateFusionFeatures(components),
          keywords: this.combineKeywords(components),
          similarGenres: components,
          fusionGenres: []
        };
        
        fusionGenres.push(fusionGenre);
      }
    }
    
    return fusionGenres;
  }
  
  // ============================================================================
  // FEATURE MATCHING
  // ============================================================================
  
  private calculateGenreMatch(features: any, genre: GenreNode): number {
    let score = 0;
    let totalWeight = 0;
    
    // Energy match
    const energyWeight = 0.2;
    const energyScore = this.calculateRangeMatch(features.energy, genre.features.energy);
    score += energyScore * energyWeight;
    totalWeight += energyWeight;
    
    // Valence match
    const valenceWeight = 0.15;
    const valenceScore = this.calculateRangeMatch(features.valence, genre.features.valence);
    score += valenceScore * valenceWeight;
    totalWeight += valenceWeight;
    
    // Danceability match
    const danceabilityWeight = 0.15;
    const danceabilityScore = this.calculateRangeMatch(features.danceability, genre.features.danceability);
    score += danceabilityScore * danceabilityWeight;
    totalWeight += danceabilityWeight;
    
    // Acousticness match
    const acousticnessWeight = 0.15;
    const acousticnessScore = this.calculateRangeMatch(features.acousticness, genre.features.acousticness);
    score += acousticnessScore * acousticnessWeight;
    totalWeight += acousticnessWeight;
    
    // Tempo match
    const tempoWeight = 0.15;
    const tempoScore = this.calculateRangeMatch(features.tempo, genre.features.tempo);
    score += tempoScore * tempoWeight;
    totalWeight += tempoWeight;
    
    // Complexity match
    const complexityWeight = 0.1;
    const complexityScore = 1 - Math.abs(features.complexity - genre.features.complexity);
    score += complexityScore * complexityWeight;
    totalWeight += complexityWeight;
    
    // Popularity match
    const popularityWeight = 0.1;
    const popularityScore = 1 - Math.abs(features.popularity - genre.features.popularity);
    score += popularityScore * popularityWeight;
    totalWeight += popularityWeight;
    
    return score / totalWeight;
  }
  
  private calculateRangeMatch(value: number, range: [number, number]): number {
    const [min, max] = range;
    if (value >= min && value <= max) {
      return 1.0;
    } else if (value < min) {
      return Math.max(0, 1 - (min - value) / (max - min));
    } else {
      return Math.max(0, 1 - (value - max) / (max - min));
    }
  }
  
  private calculateFusionMatch(features: any, components: string[]): number {
    let totalScore = 0;
    
    for (const component of components) {
      const genre = this.genreTree.get(component);
      if (genre) {
        totalScore += this.calculateGenreMatch(features, genre);
      }
    }
    
    return totalScore / components.length;
  }
  
  private calculateFusionFeatures(components: string[]): GenreNode['features'] {
    const features: GenreNode['features'] = {
      energy: [0, 1],
      valence: [0, 1],
      danceability: [0, 1],
      acousticness: [0, 1],
      tempo: [60, 200],
      complexity: 0.5,
      popularity: 0.5
    };
    
    for (const component of components) {
      const genre = this.genreTree.get(component);
      if (genre) {
        // Average the features
        features.energy[0] = (features.energy[0] + genre.features.energy[0]) / 2;
        features.energy[1] = (features.energy[1] + genre.features.energy[1]) / 2;
        features.valence[0] = (features.valence[0] + genre.features.valence[0]) / 2;
        features.valence[1] = (features.valence[1] + genre.features.valence[1]) / 2;
        features.danceability[0] = (features.danceability[0] + genre.features.danceability[0]) / 2;
        features.danceability[1] = (features.danceability[1] + genre.features.danceability[1]) / 2;
        features.acousticness[0] = (features.acousticness[0] + genre.features.acousticness[0]) / 2;
        features.acousticness[1] = (features.acousticness[1] + genre.features.acousticness[1]) / 2;
        features.tempo[0] = (features.tempo[0] + genre.features.tempo[0]) / 2;
        features.tempo[1] = (features.tempo[1] + genre.features.tempo[1]) / 2;
        features.complexity = (features.complexity + genre.features.complexity) / 2;
        features.popularity = (features.popularity + genre.features.popularity) / 2;
      }
    }
    
    return features;
  }
  
  private combineKeywords(components: string[]): string[] {
    const keywords: string[] = [];
    
    for (const component of components) {
      const genre = this.genreTree.get(component);
      if (genre) {
        keywords.push(...genre.keywords);
      }
    }
    
    return [...new Set(keywords)]; // Remove duplicates
  }
  
  // ============================================================================
  // ANALYSIS METHODS
  // ============================================================================
  
  private calculateOverallConfidence(mainGenre: GenreNode, subGenres: GenreNode[], microGenres: GenreNode[]): number {
    let totalConfidence = 0;
    let count = 0;
    
    // Main genre confidence (weighted heavily)
    totalConfidence += 0.5;
    count += 0.5;
    
    // Sub-genre confidence
    if (subGenres.length > 0) {
      totalConfidence += 0.3;
      count += 0.3;
    }
    
    // Micro-genre confidence
    if (microGenres.length > 0) {
      totalConfidence += 0.2;
      count += 0.2;
    }
    
    return count > 0 ? totalConfidence / count : 0;
  }
  
  private calculateGenreComplexity(mainGenre: GenreNode, subGenres: GenreNode[], microGenres: GenreNode[]): number {
    let complexity = mainGenre.features.complexity;
    
    // Add complexity for multiple sub-genres
    if (subGenres.length > 1) {
      complexity += 0.1;
    }
    
    // Add complexity for micro-genres
    if (microGenres.length > 0) {
      complexity += 0.1;
    }
    
    return Math.min(1, complexity);
  }
  
  private analyzeGenreEvolution(mainGenre: GenreNode, subGenres: GenreNode[]): GenreClassificationResult['genreEvolution'] {
    const era = this.determineEra(mainGenre, subGenres);
    const influences = this.identifyInfluences(mainGenre, subGenres);
    const modernVariants = this.identifyModernVariants(mainGenre, subGenres);
    
    return {
      era,
      influences,
      modernVariants
    };
  }
  
  private determineEra(mainGenre: GenreNode, subGenres: GenreNode[]): string {
    // Simple era determination based on genre characteristics
    if (mainGenre.id === 'classical') {
      return 'Classical Era';
    } else if (mainGenre.id === 'experimental') {
      return 'Modern Era';
    } else if (subGenres.some(sg => sg.id === 'synthpop')) {
      return '1980s';
    } else if (subGenres.some(sg => sg.id === 'trap')) {
      return '2010s-Present';
    } else {
      return 'Contemporary';
    }
  }
  
  private identifyInfluences(mainGenre: GenreNode, subGenres: GenreNode[]): string[] {
    const influences: string[] = [];
    
    // Add influences based on genre relationships
    influences.push(...mainGenre.similarGenres);
    
    for (const subGenre of subGenres) {
      influences.push(...subGenre.similarGenres);
    }
    
    return [...new Set(influences)]; // Remove duplicates
  }
  
  private identifyModernVariants(mainGenre: GenreNode, subGenres: GenreNode[]): string[] {
    const variants: string[] = [];
    
    // Add modern variants based on fusion genres
    for (const subGenre of subGenres) {
      variants.push(...subGenre.fusionGenres);
    }
    
    return [...new Set(variants)]; // Remove duplicates
  }
  
  // ============================================================================
  // PUBLIC API
  // ============================================================================
  
  getGenreTree(): Map<string, GenreNode> {
    return this.genreTree;
  }
  
  getGenreById(id: string): GenreNode | undefined {
    return this.genreTree.get(id);
  }
  
  getGenresByLevel(level: number): GenreNode[] {
    return Array.from(this.genreTree.values()).filter(genre => genre.level === level);
  }
  
  getFusionPatterns(): Map<string, string[]> {
    return this.fusionPatterns;
  }
}
