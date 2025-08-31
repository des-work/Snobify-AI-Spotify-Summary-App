import { z } from "zod";
export const ConfigSchema = z.object({
  profilesDir: z.string().default("profiles"),
  defaultProfile: z.string().default("default"),
  enableCloudAI: z.boolean().default(false),
  cloudAICostCapUSD: z.number().nonnegative().default(1),
  spotify: z.object({
    enabled: z.boolean().default(false),
    clientId: z.string().optional().default(""),
    redirectUri: z.string().optional().default("http://localhost:5173/callback")
  }).default({ enabled:false }),
  logging: z.object({ level: z.string().default("info"), pretty: z.boolean().default(true) }).default({ level:"info", pretty:true }),
  debug: z.object({ exposeMetrics: z.boolean().default(true), seededOrder: z.boolean().default(false) }).default({ exposeMetrics:true, seededOrder:false }),
  data: z.object({
    dropPreSpotify: z.boolean().default(true),
    cutoffMonth: z.string().default("2008-10"),          // Spotify public launch window
    maxCsvMb: z.number().positive().default(15),
    topGenresLimit: z.number().int().positive().default(15),
    weightedAverages: z.boolean().default(true),
    rareMode: z.enum(["topN","percentile"]).default("topN"),
    rareN: z.number().int().positive().default(25),
    rarePercentile: z.number().positive().max(50).default(5)
  }).default({ dropPreSpotify:true, cutoffMonth:"2008-10", maxCsvMb:15, topGenresLimit:15, weightedAverages:true, rareMode:"topN", rareN:25, rarePercentile:5 })
});
export type AppConfig = z.infer<typeof ConfigSchema>;