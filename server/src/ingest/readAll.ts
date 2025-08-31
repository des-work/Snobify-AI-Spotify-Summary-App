import fs from "fs";
import path from "path";
import readCsv, { type TrackRow } from "./readCsv.js";

export type RowEx = TrackRow & { __playlist?: string };

export async function readAllCsvs(dir: string): Promise<RowEx[]> {
  const files = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith(".csv"));
  const out: RowEx[] = [];
  for (const f of files) {
    const p = path.join(dir, f);
    try {
      const rows = await readCsv(p);
      const playlistName = path.basename(f, path.extname(f));
      for (const r of rows) {
        (r as any).__playlist = playlistName;
        out.push(r as RowEx);
      }
    } catch (err) {
      // swallow bad CSVs but continue
    }
  }
  return out;
}