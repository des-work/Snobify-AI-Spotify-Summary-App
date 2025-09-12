import { z } from "zod";
export const ConfigSchema = z.object({
  profilesDir: z.string().default("profiles"),
  defaultProfile: z.string().default("default"),
  enableCloudAI: z.boolean().default(false),
  cloudAICostCapUSD: z.number().nonnegative().default(1),
  logging: z.object({ 
    level: z.string().default("info"), 
    pretty: z.boolean().default(true) 
  }).default({ level:"info", pretty:true }),
  ml: z.object({
    enabled: z.boolean().default(true),
    models: z.object({
      genre: z.boolean().default(true),
      mood: z.boolean().default(true),
      clustering: z.boolean().default(true),
      recommendations: z.boolean().default(true)
    }).default({
      genre: true,
      mood: true,
      clustering: true,
      recommendations: true
    }),
    dataTracking: z.object({
      trackMetadata: z.boolean().default(true),
      genreClassifications: z.boolean().default(true),
      moodPredictions: z.boolean().default(true),
      artistClusters: z.boolean().default(true),
      userInteractions: z.boolean().default(false),
      personalData: z.boolean().default(false)
    }).default({
      trackMetadata: true,
      genreClassifications: true,
      moodPredictions: true,
      artistClusters: true,
      userInteractions: false,
      personalData: false
    })
  }).default({
    enabled: true,
    models: { genre: true, mood: true, clustering: true, recommendations: true },
    dataTracking: { trackMetadata: true, genreClassifications: true, moodPredictions: true, artistClusters: true, userInteractions: false, personalData: false }
  })
});
export type AppConfig = z.infer<typeof ConfigSchema>;