import { FastifyRequest, FastifyReply } from "fastify";
import fs from "fs";
import path from "path";
import { CONFIG, ROOT_DIR } from "../config/index.js";
import { DataService } from "../services/dataService.js";

export class ProfilesController {
    static async getProfiles(_request: FastifyRequest, reply: FastifyReply) {
        const profilesDir = path.join(ROOT_DIR, CONFIG.profilesDir);

        const profiles: {
            name: string;
            hasData: boolean;
            dataType: string | null;
            dataPath: string | null;
        }[] = [];

        // Scan the profiles directory for subdirectories
        try {
            if (fs.existsSync(profilesDir)) {
                const entries = fs.readdirSync(profilesDir, { withFileTypes: true });
                for (const entry of entries) {
                    if (!entry.isDirectory()) continue;
                    const name = entry.name;
                    const dp = DataService.getDataPath(name);
                    profiles.push({
                        name,
                        hasData: !!dp,
                        dataType: dp?.type ?? null,
                        dataPath: dp ? path.relative(ROOT_DIR, dp.path) : null,
                    });
                }
            }
        } catch {
            // If we can't read, just return empty list
        }

        // Also check for the shared Music data directory
        const musicDataDir = path.join(ROOT_DIR, "Music data", "spotify_playlists");
        const hasMusicData = fs.existsSync(musicDataDir);

        reply.send({
            profiles,
            defaultProfile: CONFIG.defaultProfile,
            hasMusicData,
            musicDataPath: hasMusicData ? path.relative(ROOT_DIR, musicDataDir) : null,
            profilesDir: path.relative(ROOT_DIR, profilesDir),
        });
    }
}
