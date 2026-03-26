import path from "path";
import fs from "fs";
import { CONFIG, ROOT_DIR } from "../config/index.js";
import readCsv from "../ingest/readCsv.js";
import { readAllCsvs } from "../ingest/readAll.js";

export interface DataPath {
    isDirectory: boolean;
    path: string;
    type: 'music_data' | 'single_csv' | 'profile_history';
}

export class DataService {
    static getDataPath(profile: string): DataPath | null {
        const profilesDir = path.join(ROOT_DIR, CONFIG.profilesDir);
        const pdir = path.join(profilesDir, profile);
        const hdir = path.join(pdir, "history");
        const singleCsv = path.join(pdir, "history.csv");

        // Profile-specific data always takes priority — uploaded files win.
        if (fs.existsSync(singleCsv)) {
            return {
                isDirectory: false,
                path: singleCsv,
                type: 'single_csv'
            };
        }

        if (fs.existsSync(hdir) && fs.statSync(hdir).isDirectory()) {
            return {
                isDirectory: true,
                path: hdir,
                type: 'profile_history'
            };
        }

        // Last resort: the shared "Music data" directory — only used when
        // there is no profile-specific data at all.
        const musicDataDir = path.join(ROOT_DIR, "Music data", "spotify_playlists");
        if (fs.existsSync(musicDataDir)) {
            return {
                isDirectory: true,
                path: musicDataDir,
                type: 'music_data'
            };
        }

        return null;
    }

    static async loadData(profile: string): Promise<any[]> {
        const dataPath = this.getDataPath(profile);
        if (!dataPath) {
            throw new Error("DataNotFound");
        }

        let rows: any[] = [];
        if (dataPath.isDirectory) {
            console.log(`Reading data from directory: ${dataPath.path}`);
            rows = await readAllCsvs(dataPath.path);
        } else {
            console.log(`Reading data from file: ${dataPath.path}`);
            rows = await readCsv(dataPath.path);
        }

        return Array.isArray(rows) ? rows : [];
    }
}
