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
  debug: z.object({ exposeMetrics: z.boolean().default(true), seededOrder: z.boolean().default(false) }).default({ exposeMetrics:true, seededOrder:false })
});
export type AppConfig = z.infer<typeof ConfigSchema>;
