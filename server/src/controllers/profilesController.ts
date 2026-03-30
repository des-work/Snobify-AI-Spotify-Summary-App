import { FastifyRequest, FastifyReply } from "fastify";
import fs from "fs";
import path from "path";
import { CONFIG, PROFILES_DIR, ROOT_DIR } from "../config/index.js";
import { DataService } from "../services/dataService.js";

export class ProfilesController {
    static async getProfiles(_request: FastifyRequest, reply: FastifyReply) {
        try {
            fs.mkdirSync(PROFILES_DIR, { recursive: true });

            const entries = fs.readdirSync(PROFILES_DIR, { withFileTypes: true });
            const profiles = entries
                .filter(e => e.isDirectory())
                .map(e => {
                    const dataPath = DataService.getDataPath(e.name);
                    return {
                        name: e.name,
                        hasData: dataPath !== null,
                        dataType: dataPath?.type ?? null,
                        dataPath: dataPath ? path.relative(ROOT_DIR, dataPath.path) : null,
                    };
                });

            const musicDataDir = path.join(ROOT_DIR, "Music data", "spotify_playlists");
            const hasMusicData = fs.existsSync(musicDataDir);

            reply.send({
                profiles,
                defaultProfile: CONFIG.defaultProfile,
                hasMusicData,
                musicDataPath: hasMusicData ? path.relative(ROOT_DIR, musicDataDir) : null,
                profilesDir: path.relative(ROOT_DIR, PROFILES_DIR),
            });
        } catch (err: any) {
            reply.status(500).send({
                error: { code: "SNB-5001", message: err?.message || "Failed to list profiles" },
            });
        }
    }
}
