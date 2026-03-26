// ============================================================================
// MOOD PREDICTOR - Rule-based implementation using audio features
// ============================================================================
//
// Predicts mood from Spotify audio features: valence, energy, danceability,
// acousticness, instrumentalness, tempo, loudness, speechiness.
//
// Mood space is mapped via a 2D valence-energy quadrant model:
//   High valence + high energy   → Happy / Euphoric
//   High valence + low energy    → Peaceful / Chill
//   Low valence  + high energy   → Angry / Intense
//   Low valence  + low energy    → Sad / Melancholic
//
// Secondary features refine the prediction with sub-moods.

type TrackInput = {
  trackName?: string;
  artistName?: string;
  valence?: number;
  energy?: number;
  danceability?: number;
  acousticness?: number;
  instrumentalness?: number;
  tempo?: number;
  loudness?: number;
  speechiness?: number;
};

type MoodLabel =
  | "Happy"
  | "Euphoric"
  | "Peaceful"
  | "Chill"
  | "Melancholic"
  | "Sad"
  | "Angry"
  | "Intense"
  | "Focused"
  | "Dreamy"
  | "Energetic"
  | "Neutral";

type MoodPrediction = {
  track: string;
  artist: string;
  predictedMood: MoodLabel;
  confidence: number;
  features: {
    valence: number;
    energy: number;
    danceability: number;
  };
};

function num(v: any, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function classifyMood(t: TrackInput): { mood: MoodLabel; confidence: number } {
  const v = num(t.valence, 0.5);
  const e = num(t.energy, 0.5);
  const d = num(t.danceability, 0.5);
  const a = num(t.acousticness, 0.5);
  const ins = num(t.instrumentalness, 0);
  const sp = num(t.speechiness, 0);

  // Quadrant distances from corners — higher = more aligned
  const happyScore    = v * e;                    // high V, high E
  const sadScore      = (1 - v) * (1 - e);       // low V, low E
  const angryScore    = (1 - v) * e;              // low V, high E
  const peacefulScore = v * (1 - e);              // high V, low E

  const scores: [MoodLabel, number][] = [
    ["Happy", happyScore],
    ["Sad", sadScore],
    ["Angry", angryScore],
    ["Peaceful", peacefulScore],
  ];

  // Sort to find dominant quadrant
  scores.sort((a, b) => b[1] - a[1]);
  let [mood, raw] = scores[0];
  let confidence = Math.min(0.95, 0.4 + raw * 0.6);

  // Refine with secondary features
  if (mood === "Happy" && d > 0.75 && e > 0.8) {
    mood = "Euphoric";
    confidence = Math.min(0.95, confidence + 0.05);
  }
  if (mood === "Peaceful" && a > 0.6 && ins > 0.4) {
    mood = "Dreamy";
    confidence = Math.min(0.95, confidence + 0.05);
  }
  if (mood === "Peaceful" && d > 0.55) {
    mood = "Chill";
  }
  if (mood === "Angry" && e > 0.85) {
    mood = "Intense";
    confidence = Math.min(0.95, confidence + 0.03);
  }
  if (mood === "Sad" && a > 0.65) {
    mood = "Melancholic";
    confidence = Math.min(0.95, confidence + 0.03);
  }

  // High instrumentalness + mid energy → Focused
  if (ins > 0.6 && e > 0.35 && e < 0.7 && v > 0.3 && v < 0.7) {
    mood = "Focused";
    confidence = Math.min(0.9, 0.55 + ins * 0.3);
  }

  // High energy + high danceability, regardless of valence → Energetic
  if (e > 0.8 && d > 0.7 && Math.abs(v - 0.5) < 0.2) {
    mood = "Energetic";
    confidence = Math.min(0.9, 0.5 + e * 0.3);
  }

  // Very centrist features → Neutral
  if (Math.abs(v - 0.5) < 0.12 && Math.abs(e - 0.5) < 0.12) {
    mood = "Neutral";
    confidence = 0.45;
  }

  return { mood, confidence: +confidence.toFixed(3) };
}

export class MoodPredictor {
  constructor() {
    console.log("MoodPredictor initialized (rule-based audio feature model)");
  }

  async predict(data: any[]): Promise<{
    totalTracks: number;
    predictions: MoodPrediction[];
    moodDistribution: Record<string, number>;
    dominantMood: string;
    moodDiversity: number;
    message: string;
  }> {
    console.log(`MoodPredictor analyzing ${data.length} tracks`);

    const predictions: MoodPrediction[] = data.map((track, index) => {
      const input: TrackInput = {
        trackName: track.trackName || track["Track Name"] || `Track ${index + 1}`,
        artistName: track.artistName || track["Artist Name(s)"] || "Unknown Artist",
        valence: num(track.valence ?? track["Valence"]),
        energy: num(track.energy ?? track["Energy"]),
        danceability: num(track.danceability ?? track["Danceability"]),
        acousticness: num(track.acousticness ?? track["Acousticness"]),
        instrumentalness: num(track.instrumentalness ?? track["Instrumentalness"]),
        tempo: num(track.tempo ?? track["Tempo"]),
        loudness: num(track.loudness ?? track["Loudness"]),
        speechiness: num(track.speechiness ?? track["Speechiness"]),
      };

      const { mood, confidence } = classifyMood(input);

      return {
        track: input.trackName || `Track ${index + 1}`,
        artist: input.artistName || "Unknown Artist",
        predictedMood: mood,
        confidence,
        features: {
          valence: num(input.valence),
          energy: num(input.energy),
          danceability: num(input.danceability),
        },
      };
    });

    // Mood distribution
    const moodDistribution: Record<string, number> = {};
    for (const p of predictions) {
      moodDistribution[p.predictedMood] = (moodDistribution[p.predictedMood] || 0) + 1;
    }

    // Dominant mood
    const dominantMood = Object.entries(moodDistribution)
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Neutral";

    // Mood diversity: number of distinct moods / total possible (normalized Shannon entropy)
    const total = predictions.length || 1;
    const probs = Object.values(moodDistribution).map(c => c / total);
    const H = -probs.reduce((s, p) => s + (p > 0 ? p * Math.log(p) : 0), 0);
    const Hmax = Math.log(Object.keys(moodDistribution).length || 1);
    const moodDiversity = Hmax > 0 ? +(H / Hmax).toFixed(3) : 0;

    return {
      totalTracks: data.length,
      predictions,
      moodDistribution,
      dominantMood,
      moodDiversity,
      message: `Analyzed ${data.length} tracks. Dominant mood: ${dominantMood} (${moodDistribution[dominantMood]} tracks). Mood diversity: ${(moodDiversity * 100).toFixed(0)}%.`,
    };
  }

  async trainModel(trainingData: any[]): Promise<{
    trainingSamples: number;
    modelTrained: boolean;
    message: string;
  }> {
    // Rule-based model doesn't need training, but we validate the data shape
    const validSamples = trainingData.filter(
      t => t.valence != null || t["Valence"] != null
    ).length;

    console.log(`MoodPredictor validated ${validSamples}/${trainingData.length} samples with audio features`);

    return {
      trainingSamples: trainingData.length,
      modelTrained: true,
      message: `Rule-based model ready. ${validSamples} samples have audio features for mood classification.`,
    };
  }
}
