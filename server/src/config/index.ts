import path from "path";
import fs from "fs";
import { ConfigSchema, type AppConfig } from "./schema.js";

const root = path.resolve(process.cwd(), "..");
const cfgPath = path.join(root, "snobify.config.json");

// Ensure config file exists
if (!fs.existsSync(cfgPath)) {
    fs.writeFileSync(cfgPath, JSON.stringify({
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
    }, null, 2));
}

export const CONFIG: AppConfig = ConfigSchema.parse(JSON.parse(fs.readFileSync(cfgPath, "utf8")));
export const PROFILES_DIR = path.join(root, CONFIG.profilesDir);
export const ROOT_DIR = root;
