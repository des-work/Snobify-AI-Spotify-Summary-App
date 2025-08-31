import fs from "fs";
import path from "path";

/**
 * Lightweight, free origin resolver:
 * - Reads optional JSON: cache/artist_origin.json
 *   Format: { "artist name lowercase": { country: "US", continent: "NA" }, ... }
 * - If missing, returns null and we bucket as "Unknown".
 */
export type Origin = { country?: string; continent?: string };
const CACHE_FILE = path.resolve(process.cwd(), "..", "cache", "artist_origin.json");

let DB: Record<string, Origin> | null = null;
function loadDb(){
  if(DB !== null) return;
  try{
    if(fs.existsSync(CACHE_FILE)){
      DB = JSON.parse(fs.readFileSync(CACHE_FILE,"utf8"));
    } else {
      DB = {};
    }
  }catch{ DB = {}; }
}

export function lookupOrigin(artistName: string): Origin | null {
  loadDb();
  if(!artistName) return null;
  const key = artistName.trim().toLowerCase();
  return (DB as any)?.[key] ?? null;
}