// ============================================================================
// SNOBIFY SERVER - COMPREHENSIVE OVERHAUL
// ============================================================================

import { incRequest, metricsText, Timer, incError } from "./observability/metrics.js";
import path from "path";
import fs from "fs";
import { scoreOnePlaylist, rareEligibilityFromPlaylists } from "./compute/playlistScore.js";

import Fastify, { FastifyRequest } from "fastify";
import cors from "@fastify/cors";

// Extend FastifyRequest to include timer
declare module 'fastify' {
  interface FastifyRequest {
    timer?: Timer;
  }
}

import { ConfigSchema, type AppConfig } from "./config/schema.js";
import { logger } from "./observability/logger.js";
import { sendError } from "./errors/respond.js";

// Stats (original)
import readCsv from "./ingest/readCsv.js";
import { readAllCsvs, readPlaylistsAsMapLoose } from "./ingest/readAll.js";

import { compute } from "./compute/compute.js";

// New analysis
import { analyzeLibrary } from "./compute/libraryAnalysis.js";
import { buildTasteProfile } from "./compute/tasteProfile.js";
import { computePlaylistRatings } from "./compute/playlistRatings.js";

// ML imports
import { MusicMLAnalyzer } from "./ml/analyzer.js";
import { GenreClassifier } from "./ml/genreClassifier.js";
import { MoodPredictor } from "./ml/moodPredictor.js";
import { ArtistClusterer } from "./ml/artistClusterer.js";
import { RecommendationEngine } from "./ml/recommendationEngine.js";

// New systems
import { HealthChecker } from "./health/healthCheck.js";
import { errorHandler } from "./errors/errorHandler.js";
import { StartupValidator } from "./startup/startupValidator.js";
import { 
  connectionMiddleware, 
  connectionTrackingMiddleware, 
  performanceHeadersMiddleware 
} from "./middleware/connectionMiddleware.js";

// ============================================================================
// SERVER INITIALIZATION
// ============================================================================

const reqId = () => Math.random().toString(36).slice(2, 9);
const root = path.resolve(process.cwd(), "..");
const cfgPath = path.join(root, "snobify.config.json");

// Global instances
let healthChecker: HealthChecker;
let startupValidator: StartupValidator;
let mlAnalyzer: MusicMLAnalyzer;
let genreClassifier: GenreClassifier;
let moodPredictor: MoodPredictor;
let artistClusterer: ArtistClusterer;
let recommendationEngine: RecommendationEngine;

// ============================================================================
// CONFIGURATION SETUP
// ============================================================================

async function setupConfiguration(): Promise<AppConfig> {
  console.log('⚙️ Setting up configuration...');
  
  // Ensure config file exists
  if (!fs.existsSync(cfgPath)) {
    console.log('📝 Creating default configuration...');
    const defaultConfig = {
      profilesDir: "profiles",
      defaultProfile: "default",
      enableCloudAI: false,
      cloudAICostCapUSD: 1,
      logging: { level: "info", pretty: true },
      ml: {
        enabled: true,
        models: {
          genre: true,
          mood: true,
          clustering: true,
          recommendations: true
        },
        dataTracking: {
          trackMetadata: true,
          genreClassifications: true,
          moodPredictions: true,
          artistClusters: true,
          userInteractions: false,
          personalData: false
        }
      }
    };
    
    fs.writeFileSync(cfgPath, JSON.stringify(defaultConfig, null, 2));
    console.log('✅ Default configuration created');
  }

  try {
    const configContent = fs.readFileSync(cfgPath, "utf8");
    const config = ConfigSchema.parse(JSON.parse(configContent));
    console.log('✅ Configuration loaded successfully');
    return config;
  } catch (error) {
    console.error('❌ Configuration validation failed:', error);
    throw error;
  }
}

// ============================================================================
// STARTUP VALIDATION
// ============================================================================

async function performStartupValidation(): Promise<boolean> {
  console.log('🔍 Performing startup validation...');
  
  try {
    startupValidator = new StartupValidator();
    const validationResult = await startupValidator.validateAll();
    
    if (!validationResult.success) {
      console.error('❌ Startup validation failed:');
      validationResult.errors.forEach(error => console.error(`  - ${error}`));
      
      if (validationResult.warnings.length > 0) {
        console.warn('⚠️ Warnings:');
        validationResult.warnings.forEach(warning => console.warn(`  - ${warning}`));
      }
      
      return false;
    }
    
    if (validationResult.warnings.length > 0) {
      console.warn('⚠️ Startup warnings:');
      validationResult.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
    
    console.log('✅ Startup validation completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Startup validation error:', error);
    return false;
  }
}

// ============================================================================
// ML COMPONENTS INITIALIZATION
// ============================================================================

async function initializeMLComponents(config: AppConfig): Promise<void> {
  console.log('🤖 Initializing ML components...');
  
  try {
    if (config.ml?.enabled) {
      console.log('  - Initializing ML Analyzer...');
      mlAnalyzer = new MusicMLAnalyzer();
      
      console.log('  - Initializing Genre Classifier...');
      genreClassifier = new GenreClassifier();
      
      console.log('  - Initializing Mood Predictor...');
      moodPredictor = new MoodPredictor();
      
      console.log('  - Initializing Artist Clusterer...');
      artistClusterer = new ArtistClusterer();
      
      console.log('  - Initializing Recommendation Engine...');
      recommendationEngine = new RecommendationEngine();
      
      console.log('✅ All ML components initialized successfully');
    } else {
      console.log('⚠️ ML components disabled in configuration');
    }
  } catch (error) {
    console.error('❌ ML components initialization failed:', error);
    throw error;
  }
}

// ============================================================================
// HEALTH CHECK SYSTEM
// ============================================================================

async function initializeHealthChecker(): Promise<void> {
  console.log('🏥 Initializing health checker...');
  
  try {
    healthChecker = new HealthChecker();
    console.log('✅ Health checker initialized');
  } catch (error) {
    console.error('❌ Health checker initialization failed:', error);
    throw error;
  }
}

// ============================================================================
// FASTIFY SERVER SETUP
// ============================================================================

async function createFastifyServer(): Promise<any> {
  console.log('🚀 Creating Fastify server...');
  
  const app = Fastify({
    logger: {
      level: 'info'
    },
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'reqId',
    genReqId: reqId
  });

  // Register plugins
  await app.register(cors, {
    origin: true,
    credentials: true
  });

  // Error handling
  app.setErrorHandler(async (error, request, reply) => {
    await errorHandler.handleAsyncError(error, request, reply);
  });

  // Enhanced request handling with connection tracking
  app.addHook('onRequest', async (request, reply) => {
    healthChecker.incrementConnections();
    const timer = new Timer();
    request.timer = timer;
    reply.header("x-req-id", request.id);
    
    // Connection tracking
    await connectionTrackingMiddleware(request, reply);
  });

  app.addHook('onResponse', async (request, reply) => {
    healthChecker.decrementConnections();
    if (request.timer) {
      reply.header("Server-Timing", request.timer.header());
    }
    
    // Performance headers
    await performanceHeadersMiddleware(request, reply);
  });

  return app;
}

// ============================================================================
// API ROUTES
// ============================================================================

async function setupAPIRoutes(app: any, config: AppConfig): Promise<void> {
  console.log('🛣️ Setting up API routes...');

  // Enhanced health check endpoint
  app.get("/health", async (request, reply) => {
    const healthStatus = await healthChecker.checkHealth();
    const connectionMetrics = connectionMiddleware.getMetrics();
    const connectionHealth = connectionMiddleware.getHealthStatus();
    
    reply.send({
      ...healthStatus,
      connections: {
        metrics: connectionMetrics,
        health: connectionHealth,
        stats: connectionMiddleware.getConnectionStats(),
        performance: connectionMiddleware.getPerformanceStats(),
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Debug endpoint
  app.get("/debug", async (request, reply) => {
    const errorStats = errorHandler.getErrorStats();
    const validationResults = startupValidator.getValidationResults();
    
    reply.send({
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      errorStats,
      validationResults,
      config: {
        mlEnabled: config.ml?.enabled || false,
        profilesDir: config.profilesDir,
        defaultProfile: config.defaultProfile
      }
    });
  });

  // Original stats endpoint
  app.get("/api/stats", async (request, reply) => {
    const id = reqId();
    incRequest("/api/stats");
    const timer = new Timer();
    reply.header("x-req-id", id);

    const q = (request.query as any) || {};
    const profile = String(q.profile || config.defaultProfile);
    reply.header("x-snobify-profile", profile);

    try {
      const dataPath = getDataPath(profile);
      if (!dataPath) {
        return sendError(reply, "ProfileNotFound", "No music data found", id);
      }

      let rows: any[] = [];
      if (dataPath.isDirectory) {
        rows = await readAllCsvs(dataPath.path);
      } else {
        rows = await readCsv(dataPath.path);
      }

      rows = safeArr<any>(rows);
      const stats = compute(rows);

      reply.header("Server-Timing", timer.header());
      reply.send({ profile, stats });
    } catch (err: any) {
      incError("/api/stats");
      errorHandler.logError(err, request, reply);
      logger.error({ err: String(err), reqId: id }, "Stats computation failed");
      return sendError(reply, "ComputeFailed", err?.message || "Unknown error", id);
    }
  });

  // ML Analysis endpoint
  app.get("/api/ml-analysis", async (request, reply) => {
    const id = reqId();
    incRequest("/api/ml-analysis");
    const timer = new Timer();
    reply.header("x-req-id", id);

    const q = (request.query as any) || {};
    const profile = String(q.profile || config.defaultProfile);
    reply.header("x-snobify-profile", profile);

    try {
      if (!config.ml?.enabled) {
        return sendError(reply, "ServiceUnavailable", "ML analysis is disabled", id);
      }

      const dataPath = getDataPath(profile);
      if (!dataPath) {
        return sendError(reply, "ProfileNotFound", "No music data found", id);
      }

      let rows: any[] = [];
      if (dataPath.isDirectory) {
        rows = await readAllCsvs(dataPath.path);
      } else {
        rows = await readCsv(dataPath.path);
      }

      rows = safeArr<any>(rows);
      
      // Run ML analysis
      const mlResults = await mlAnalyzer.analyze(rows);
      
      reply.header("Server-Timing", timer.header());
      reply.send({ profile, mlResults });
    } catch (err: any) {
      incError("/api/ml-analysis");
      errorHandler.logError(err, request, reply);
      logger.error({ err: String(err), reqId: id }, "ML analysis failed");
      return sendError(reply, "ComputeFailed", err?.message || "Unknown error", id);
    }
  });

  // Mood prediction endpoint
  app.get("/api/mood-prediction", async (request, reply) => {
    const id = reqId();
    incRequest("/api/mood-prediction");
    const timer = new Timer();
    reply.header("x-req-id", id);

    const q = (request.query as any) || {};
    const profile = String(q.profile || config.defaultProfile);
    reply.header("x-snobify-profile", profile);

    try {
      if (!config.ml?.enabled || !config.ml?.models?.mood) {
        return sendError(reply, "ServiceUnavailable", "Mood prediction is disabled", id);
      }

      const dataPath = getDataPath(profile);
      if (!dataPath) {
        return sendError(reply, "ProfileNotFound", "No music data found", id);
      }

      let rows: any[] = [];
      if (dataPath.isDirectory) {
        rows = await readAllCsvs(dataPath.path);
      } else {
        rows = await readCsv(dataPath.path);
      }

      rows = safeArr<any>(rows);
      
      // Run mood prediction
      const moodResults = await moodPredictor.predict(rows);
      
      reply.header("Server-Timing", timer.header());
      reply.send({ profile, moodResults });
    } catch (err: any) {
      incError("/api/mood-prediction");
      errorHandler.logError(err, request, reply);
      logger.error({ err: String(err), reqId: id }, "Mood prediction failed");
      return sendError(reply, "ComputeFailed", err?.message || "Unknown error", id);
    }
  });

  // Mood training endpoint
  app.post("/api/mood-training", async (request, reply) => {
    const id = reqId();
    incRequest("/api/mood-training");
    const timer = new Timer();
    reply.header("x-req-id", id);

    const q = (request.query as any) || {};
    const profile = String(q.profile || config.defaultProfile);
    reply.header("x-snobify-profile", profile);

    try {
      if (!config.ml?.enabled || !config.ml?.models?.mood) {
        return sendError(reply, "ServiceUnavailable", "Mood training is disabled", id);
      }

      const dataPath = getDataPath(profile);
      if (!dataPath) {
        return sendError(reply, "ProfileNotFound", "No music data found", id);
      }

      let rows: any[] = [];
      if (dataPath.isDirectory) {
        rows = await readAllCsvs(dataPath.path);
      } else {
        rows = await readCsv(dataPath.path);
      }

      rows = safeArr<any>(rows);
      
      // Prepare training data
      const trainingData = [];
      for (const track of rows.slice(0, 100)) {
        const audioFeatures = {
          valence: track.valence || 0,
          energy: track.energy || 0,
          danceability: track.danceability || 0,
          acousticness: track.acousticness || 0,
          tempo: track.tempo || 120
        };
        
        let mood = 'Happy';
        if (audioFeatures.valence < 0.3) mood = 'Sad';
        else if (audioFeatures.valence > 0.7 && audioFeatures.energy > 0.7) mood = 'Excited';
        else if (audioFeatures.energy > 0.6) mood = 'Energetic';
        else if (audioFeatures.energy < 0.3) mood = 'Calm';
        
        trainingData.push({
          features: audioFeatures,
          mood,
          confidence: 0.8
        });
      }
      
      // Train the model
      await moodPredictor.trainModel(trainingData);
      
      reply.header("Server-Timing", timer.header());
      reply.send({ 
        profile, 
        trainingSamples: trainingData.length,
        modelTrained: true,
        message: "Mood prediction model trained successfully"
      });
    } catch (err: any) {
      incError("/api/mood-training");
      errorHandler.logError(err, request, reply);
      logger.error({ err: String(err), reqId: id }, "Mood training failed");
      return sendError(reply, "ComputeFailed", err?.message || "Unknown error", id);
    }
  });

  console.log('✅ API routes configured');
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const safeArr = <T>(x: any): T[] => Array.isArray(x) ? x as T[] : [];
const firstDateISO = (dates: Date[]) => dates.length ? dates[0].toISOString() : "";

function getDataPath(profile: string): { path: string; isDirectory: boolean } | null {
  const profilesDir = path.join(root, "profiles");
  const profilePath = path.join(profilesDir, profile);
  
  if (fs.existsSync(profilePath)) {
    return { path: profilePath, isDirectory: true };
  }
  
  const musicDataPath = path.join(root, "Music data");
  if (fs.existsSync(musicDataPath)) {
    return { path: musicDataPath, isDirectory: true };
  }
  
  return null;
}

// ============================================================================
// SERVER STARTUP
// ============================================================================

async function startServer(): Promise<void> {
  try {
    console.log('🎵 Starting Snobify Server...');
    console.log('=====================================');

    // Step 1: Setup configuration
    const config = await setupConfiguration();

    // Step 2: Perform startup validation
    const validationPassed = await performStartupValidation();
    if (!validationPassed) {
      console.error('❌ Startup validation failed. Server will not start.');
      process.exit(1);
    }

    // Step 3: Initialize health checker
    await initializeHealthChecker();

    // Step 4: Initialize ML components
    await initializeMLComponents(config);

    // Step 5: Create Fastify server
    const app = await createFastifyServer();

    // Step 6: Setup API routes
    await setupAPIRoutes(app, config);

    // Step 7: Start server
    const PORT = Number(process.env.PORT || 8899);
    await app.listen({ port: PORT, host: "127.0.0.1" });

    console.log('=====================================');
    console.log(`✅ Snobify server listening on http://127.0.0.1:${PORT}`);
    console.log(`🏥 Health check: http://127.0.0.1:${PORT}/health`);
    console.log(`🐛 Debug info: http://127.0.0.1:${PORT}/debug`);
    console.log(`🤖 ML Analysis: ${config.ml?.enabled ? 'enabled' : 'disabled'}`);
    console.log(`📊 Data tracking: ${JSON.stringify(config.ml?.dataTracking || {})}`);
    console.log('=====================================');

  } catch (error) {
    console.error('❌ Server startup failed:', error);
    errorHandler.logError(error as Error, undefined, undefined);
    process.exit(1);
  }
}

// ============================================================================
// START THE SERVER
// ============================================================================

startServer();
